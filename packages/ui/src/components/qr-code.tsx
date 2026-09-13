import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
}

export function QRCode({
  value,
  size = 200,
  level = 'M',
  includeMargin = false,
  className,
}: QRCodeProps) {
  return (
    <div className={className}>
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
      />
    </div>
  );
}
