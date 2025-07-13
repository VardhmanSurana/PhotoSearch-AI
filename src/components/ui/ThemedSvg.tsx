import React from 'react';
import { useTheme } from '@/hooks/useTheme';

interface ThemedSvgProps extends React.SVGProps<SVGSVGElement> {
  children: React.ReactNode;
}

const ThemedSvg: React.FC<ThemedSvgProps> = ({ children, ...props }) => {
  const { theme } = useTheme();
  const fillColor = theme === 'dark' ? 'white' : 'black';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={fillColor}
      {...props}
    >
      {children}
    </svg>
  );
};

export default ThemedSvg;
