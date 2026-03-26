import { useEffect, useRef, useState } from 'react';

interface TypewriterOptions {
  baseDelay?: number;
  randomVariation?: number;
  extraPauseChance?: number;
  extraPauseAmount?: () => number;
  trigger?: boolean; // controls when animation starts
}

const defaultExtraPauseAmount = () => 30 + Math.random() * 30;

export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const {
    baseDelay = 40,
    randomVariation = 40,
    extraPauseChance = 0.1,
    extraPauseAmount = defaultExtraPauseAmount,
    trigger = true,
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!trigger) {
      setDisplayText('');
      setIsComplete(false);
      return;
    }

    let index = 0;
    setDisplayText('');
    setIsComplete(false);

    const typeNext = () => {
      if (index < text.length) {
        index++;
        setDisplayText(text.substring(0, index));

        const delay = baseDelay + Math.random() * randomVariation;
        const extra = Math.random() < extraPauseChance ? extraPauseAmount() : 0;
        timeoutRef.current = setTimeout(typeNext, delay + extra);
      } else {
        setIsComplete(true);
      }
    };

    timeoutRef.current = setTimeout(typeNext, baseDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, trigger]);

  return { displayText, isComplete };
}
