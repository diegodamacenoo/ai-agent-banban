'use client'

import { useState, useEffect } from 'react'

interface TypingAnimationProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export function TypingAnimation({ text, speed = 300, className = '', onComplete }: TypingAnimationProps) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const wordsWithSpaces = text.split(' ')

  useEffect(() => {
    if (currentWordIndex < wordsWithSpaces.length) {
      const timeout = setTimeout(() => {
        setDisplayedWords(prev => [...prev, wordsWithSpaces[currentWordIndex]])
        setCurrentWordIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentWordIndex, wordsWithSpaces, speed, onComplete])

  useEffect(() => {
    setDisplayedWords([])
    setCurrentWordIndex(0)
  }, [text])

  return (
    <span className={`${className} inline-block min-h-[2.5em] leading-tight`}>
      {displayedWords.map((word, index) => (
        <span key={index} className="inline-block">
          <span
            className="animate-in fade-in duration-500"
            style={{ animationDelay: '0ms' }}
          >
            {word}
          </span>
          {index < displayedWords.length - 1 && (
            <span>&nbsp;</span>
          )}
        </span>
      ))}
    </span>
  )
} 
