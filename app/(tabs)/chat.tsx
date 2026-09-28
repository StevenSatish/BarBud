import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { httpsCallable } from 'firebase/functions';
import { Text } from '@/components/ui/text';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { useTheme } from '@/app/context/ThemeContext';
import useExerciseDB from '@/app/context/ExerciseDBContext';
import { ArrowUp } from 'lucide-react-native';
import { doc, setDoc} from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH, FIREBASE_FUNCTIONS } from '@/FirebaseConfig';
import useTemplateFolders from '../context/TemplateFoldersContext';

export default function Chat() {
  const { theme, colors } = useTheme();
  const { exerciseSections } = useExerciseDB();
  type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'assistant',
      text: `Hi! I'm Bud, your workout assistant. I like talking about working out and not much else. I can also create custom workout 
templates for you that'll appear in the 'Workout' tab.`,
    },
  ]);
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<any>(null);
  const [templateWaiting, setTemplateWaiting] = useState(false);
  const { fetchFolders, fetchTemplates } = useTemplateFolders();

  const flattenExercises = () => {
    const flat: { exerciseId: string; name: string; category: string; muscleGroup?: string }[] = [];
    exerciseSections.forEach((section) => {
      section.data.forEach((ex: any) => {
        const exerciseId = ex.exerciseId || ex.id;
        const name = ex.name;
        const category = ex.category;
        if (exerciseId && name && category) {
          flat.push({
            exerciseId,
            name,
            category,
            muscleGroup: ex.muscleGroup,
          });
        }
      });
    });
    return flat;
  };

  const filterExercisesForQuery = (query: string) => {
    const MAX = 30;
    const flat = flattenExercises();
    const q = query.toLowerCase();
    const filtered = flat.filter((ex) => {
      const name = ex.name?.toLowerCase() || '';
      const category = ex.category?.toLowerCase() || '';
      return name.includes(q) || category.includes(q);
    });
    const result = (filtered.length ? filtered : flat).slice(0, MAX);
    return result;
  };

  const chatErrorMessage = (err: unknown) => {
    const code = (err as { code?: string })?.code;
    const message = (err as { message?: string })?.message;
    if (code === 'functions/unauthenticated') {
      return 'Sign in to use chat.';
    }
    if (code === 'functions/resource-exhausted') {
      return message || 'Too many messages. Please wait and try again.';
    }
    if (code === 'functions/invalid-argument') {
      return message || 'That message could not be sent.';
    }
    return 'Something went wrong sending that message.';
  };

  const saveTemplate = async (template: any) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user?.uid) {
      console.error('No authenticated user; cannot save template.');
      return;
    }

    const templateName = typeof template?.templateName === 'string' ? template.templateName.trim() : '';
    if (!templateName) {
      console.error('Template missing templateName; skipping save.');
      return;
    }

    const exercises = Array.isArray(template?.exercises) ? template.exercises : [];
    const safeExercises = exercises
      .map((ex: any) => ({
        exerciseId: ex?.exerciseId,
        name: ex?.name,
        category: ex?.category,
        numSets: ex?.numSets ?? 1,
      }))
      .filter((ex: any) => ex.exerciseId && ex.name && ex.category);

    const safeFolderId = 'none';
    const slug = templateName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    const templateId = slug || 'template';

    await setDoc(
      doc(FIREBASE_DB, 'users', user.uid, 'folders', safeFolderId, 'templates', templateId),
      {
        templateName,
        exercises: safeExercises,
      },
    );

    try {
        const latestFolders = await fetchFolders();
        await fetchTemplates(latestFolders);
    } catch (err) {
      console.error('Failed to refresh templates after write', err);
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    if (!FIREBASE_AUTH.currentUser) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', text: 'Sign in to use chat.' },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'intro')
      .map((m) => ({ role: m.role, text: m.text }));

    setSending(true);
    setTemplateWaiting(false);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const chatFn = httpsCallable(FIREBASE_FUNCTIONS, 'chatCompletion');
      const result = await chatFn({
        userMessage: trimmed,
        history: historyForApi,
        exerciseCatalog: filterExercisesForQuery(trimmed),
      });
      const payload = result.data as
        | { kind: 'message'; text: string }
        | { kind: 'template'; template: any };

      if (payload?.kind === 'template') {
        setTemplateWaiting(true);
        try {
          await saveTemplate(payload.template);
          setMessages((prev) => [
            ...prev,
            { id: `${Date.now()}-assistant`, role: 'assistant', text: 'Template created! Go check it out.' },
          ]);
        } catch (err) {
          console.error('Failed to save template', err);
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-assistant`,
              role: 'assistant',
              text: 'Sorry, I could not create that template. Please try again.',
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            text: payload?.kind === 'message' ? payload.text : 'Sorry, I only like to talk about working out.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: chatErrorMessage(err),
        },
      ]);
      console.error('Chat send error', err);
    } finally {
      setSending(false);
      setTemplateWaiting(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  const handleSubmit = () => {
    sendMessage();
    inputRef.current?.focus?.();
  };

  return (
    <SafeAreaView className={`flex-1 bg-${theme}-background`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-4 pt-2">
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }}
            keyboardDismissMode="on-drag"
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <View
                  key={m.id}
                  className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <View
                    className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                      isUser
                        ? `bg-${theme}-light border-transparent`
                        : 'border-outline-200'
                    }`}
                    style={!isUser ? { backgroundColor: colors.tab } : undefined}
                  >
                    <Text
                      className={
                        isUser ? `text-${theme}-background` : 'text-typography-800'
                      }
                    >
                      {m.text}
                    </Text>
                  </View>
                </View>
              );
            })}

            {(sending || templateWaiting) && (
              <View className="flex-row justify-start">
                <View
                  className="max-w-[85%] rounded-2xl px-4 py-3 border border-outline-200 flex-row items-center gap-2"
                  style={{ backgroundColor: colors.tab }}
                >
                  <Spinner />
                  {templateWaiting && (
                    <Text className="text-typography-700">Creating template</Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        <View className="px-4 pb-4">
          <HStack className="items-center gap-2">
            <Textarea
              variant="default"
              size="sm"
              className="flex-1 border-outline-200 rounded-xl"
            >
              <TextareaInput
                multiline
                numberOfLines={1}
                scrollEnabled={false}
                placeholder="Send a message..."
                placeholderTextColor={colors.lightGray}
                className="text-md"
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                editable={!sending}
                returnKeyType="send"
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 50);
                }}
              />
            </Textarea>
            <Button
              size="lg"
              variant="solid"
              className={`rounded-full bg-${theme}-light`}
              onPress={handleSubmit}
              isDisabled={sending || !input.trim()}
            >
              <ButtonText className={`text-${theme}-background text-base`}>
                <ButtonIcon as={ArrowUp} />
              </ButtonText>
            </Button>
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
