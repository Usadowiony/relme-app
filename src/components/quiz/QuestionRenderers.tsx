import type { Answer } from '../../types/quiz';
import QuizChoiceButton from '../ui/buttons/QuizChoiceButton';
import QuizSlider from '../ui/sliders/QuizSlider';

type ChoiceRendererProps = {
  answers: Answer[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
};

export function SingleChoiceRenderer({ answers, selectedIds, onSelect }: ChoiceRendererProps) {
  const handleToggle = (id: string) => {
    onSelect([id]);
  };

  return (
    <div className="flex flex-col gap-3.5 xs:gap-4.5 pb-1 xs:pb-2">
      {answers.map((ans) => {
        const isSelected = selectedIds.includes(ans.id);
        return (
          <QuizChoiceButton key={ans.id} isSelected={isSelected} onClick={() => handleToggle(ans.id)}>
            {ans.content}
          </QuizChoiceButton>
        );
      })}
    </div>
  );
}

export function MultiChoiceRenderer({ answers, selectedIds, onSelect }: ChoiceRendererProps) {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((x) => x !== id));
    } else {
      // Allow multiple
      onSelect([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 xs:gap-4.5 pb-1 xs:pb-2">
      {answers.map((ans) => {
        const isSelected = selectedIds.includes(ans.id);
        return (
          <QuizChoiceButton key={ans.id} isSelected={isSelected} onClick={() => handleToggle(ans.id)}>
            {ans.content}
          </QuizChoiceButton>
        );
      })}
    </div>
  );
}

type ScaleRendererProps = {
  answers: Answer[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
};

export function ScaleRenderer({ answers, selectedIds, onSelect }: ScaleRendererProps) {


  let startLabel = 'Zdecydowanie nie';
  let endLabel = 'Zdecydowanie tak';

  try {
    if (answers.length > 0) {
      const parsed = JSON.parse(answers[0].content);
      if (parsed.start) startLabel = parsed.start;
      if (parsed.end) endLabel = parsed.end;
    }
  } catch (e) {

  }

  // Find index of selected answer to draw the filled track
  const selectedIndex = answers.findIndex(a => selectedIds.includes(a.id));

  return (
    <div className="w-full px-2 2xs:px-0 flex flex-col gap-2 mt-8 md:mt-2 md:mb-8">

      <QuizSlider
        answers={answers}
        valueIndex={Math.max(0, Math.min(answers.length - 1, selectedIndex))}
        onChangeIndex={(idx) => onSelect([answers[idx].id])}
      />

      {/* Labels */}
      <div className="flex justify-between font-semibold text-[12px] 2xs:text-[13px] 2sm:text-[14px] tracking-tighter leading-tight text-center md:text-[15px] text-dark/90 md:mt-6 px-1">
        <span className='text-left'>{startLabel}</span>
        <span className='text-right'>{endLabel}</span>
      </div>
    </div>
  );
}
