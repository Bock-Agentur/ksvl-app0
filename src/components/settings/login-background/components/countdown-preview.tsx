/**
 * CountdownPreview Component
 * 
 * Displays a live countdown timer preview.
 */

import { useState, useEffect } from "react";

interface CountdownPreviewProps {
  endDate: string | null;
  text: string;
  small?: boolean;
  showDays?: boolean;
  fontSize?: number;
  fontWeight?: number;
}

export function CountdownPreview({ 
  endDate, 
  text, 
  small, 
  showDays, 
  fontSize, 
  fontWeight 
}: CountdownPreviewProps) {
  const [timeLeft, setTimeLeft] = useState({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    tenths: 0, 
    hundredths: 0 
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const ms = difference % 1000;
        const totalHours = Math.floor(difference / (1000 * 60 * 60));
        const hours = showDays !== false 
          ? Math.floor((difference / (1000 * 60 * 60)) % 24)
          : totalHours;
        
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours,
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          tenths: Math.floor(ms / 100),
          hundredths: Math.floor((ms % 100) / 10)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 10);

    return () => clearInterval(timer);
  }, [endDate, showDays]);

  if (!endDate) return null;

  const baseFontSize = fontSize || (small ? 24 : 48);
  const textSize = `${baseFontSize}px`;
  const labelSize = small ? 'text-[8px]' : 'text-[10px]';
  const weight = fontWeight || 100;
  const actualShowDays = showDays !== false;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex justify-center items-start gap-0.5">
        {actualShowDays && (
          <>
            <div className="flex flex-col items-center">
              <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className={`${labelSize} text-white/70 mt-0.5`}>Tage</span>
            </div>
            <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
          </>
        )}
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>Stunden</span>
        </div>
        <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>Minuten</span>
        </div>
        <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>Sekunden</span>
        </div>
        <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>
            {String(timeLeft.tenths)}{String(timeLeft.hundredths)}
          </span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>1/100</span>
        </div>
      </div>
      {text && (
        <p className={`text-white/90 ${small ? 'text-[10px]' : 'text-sm'} mt-2`}>{text}</p>
      )}
    </div>
  );
}
