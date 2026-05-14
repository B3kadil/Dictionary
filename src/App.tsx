import { useState } from 'react';
import { Screen } from './types';
import { useStorage } from './hooks/useStorage';
import vocabularyData from './data/vocabulary.json';
import HomeScreen from './screens/HomeScreen';
import FlashcardScreen from './screens/FlashcardScreen';
import ResultsScreen from './screens/ResultsScreen';
import StatsScreen from './screens/StatsScreen';
import WordListScreen from './screens/WordListScreen';
import QuizScreen from './screens/QuizScreen';
import { VocabularyData } from './types';

const vocab = vocabularyData as VocabularyData;

export default function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'home' });
  const { storage, updateProgress, resetCategory } = useStorage();

  const navigate = (s: Screen) => setScreen(s);

  if (screen.type === 'home') {
    return (
      <HomeScreen
        categories={vocab.categories}
        totalWords={vocab.meta.total_words}
        progress={storage.progress}
        onNavigate={navigate}
      />
    );
  }

  if (screen.type === 'flashcard') {
    return (
      <FlashcardScreen
        session={screen.session}
        categories={vocab.categories}
        progress={storage.progress}
        onWordResult={updateProgress}
        onNavigate={navigate}
      />
    );
  }

  if (screen.type === 'results') {
    return (
      <ResultsScreen
        categoryId={screen.categoryId}
        results={screen.results}
        categories={vocab.categories}
        onNavigate={navigate}
        onReset={resetCategory}
      />
    );
  }

  if (screen.type === 'stats') {
    return (
      <StatsScreen
        categories={vocab.categories}
        totalWords={vocab.meta.total_words}
        storage={storage}
        onNavigate={navigate}
      />
    );
  }

  if (screen.type === 'wordlist') {
    return (
      <WordListScreen
        categories={vocab.categories}
        progress={storage.progress}
        onNavigate={navigate}
      />
    );
  }

  if (screen.type === 'quiz') {
    return (
      <QuizScreen
        categories={vocab.categories}
        progress={storage.progress}
        onNavigate={navigate}
      />
    );
  }

  return null;
}
