import QuestionCard from '../../components/exam/QuestionCard';
import ReactionTest from '../../components/psycho/ReactionTest';
import ConstantVelocityOcclusionTest from '../../components/psycho/ConstantVelocityOcclusionTest';
import CoordinationTest from '../../components/psycho/CoordinationTest';
import AttentionReactionTest from '../../components/psycho/AttentionReactionTest';
import type { Question } from '../../types';

export function TheoryStep({
  question,
  selected,
  onSelect,
}: {
  question: Question;
  selected: number | null;
  onSelect: (sel: number) => void;
}) {
  return <QuestionCard q={question} selected={selected} onSelect={onSelect} />;
}

export function SignsStep({
  question,
  selected,
  onSelect,
}: {
  question: Question;
  selected: number | null;
  onSelect: (sel: number) => void;
}) {
  return <QuestionCard q={question} selected={selected} onSelect={onSelect} />;
}

export function ReactionStep({
  onComplete,
}: {
  onComplete: (sum: unknown) => void;
}) {
  return <ReactionTest compact onComplete={onComplete} />;
}

export function VelocityStep({
  onComplete,
}: {
  onComplete: (sum: unknown) => void;
}) {
  return <ConstantVelocityOcclusionTest compact onComplete={onComplete} />;
}

export function CoordStep({
  onComplete,
}: {
  onComplete: (sum: unknown) => void;
}) {
  return <CoordinationTest compact onComplete={onComplete} />;
}

export function AttentionStep({
  onComplete,
}: {
  onComplete: (sum: unknown) => void;
}) {
  return <AttentionReactionTest compact onComplete={onComplete} />;
}
