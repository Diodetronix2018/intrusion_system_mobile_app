/**
 * Inline SVG icons, drawn with react-native-svg.
 *
 * Every icon takes `size` and `color` and defaults to the current theme text
 * colour, so they can be dropped straight into <Input leftIcon={...} /> or
 * <Button leftIcon={...} /> without extra styling.
 *
 * Brand marks (Google, Apple) keep their own colours and ignore `color`.
 */
import React from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from 'react-native-svg';

import { useTheme } from '../theme';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function useIconProps({ size, color, strokeWidth }: IconProps) {
  const theme = useTheme();
  return {
    size: size ?? theme.sizing.iconLg,
    color: color ?? theme.colors.textSecondary,
    strokeWidth: strokeWidth ?? 2,
  };
}

/** Shared wrapper: 24×24 grid, round caps, stroke-only. */
function Outline({
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  const { size, color, strokeWidth } = useIconProps(props);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const MailIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Polyline points="22,6 12,13 2,6" />
  </Outline>
);

export const LockIcon = (props: IconProps) => (
  <Outline {...props}>
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Outline>
);

export const UserIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Outline>
);

export const PhoneIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Outline>
);

export const EyeIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Outline>
);

export const EyeOffIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Outline>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Outline {...props}>
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Polyline points="12,19 5,12 12,5" />
  </Outline>
);

export const CheckIcon = (props: IconProps) => (
  <Outline {...props}>
    <Polyline points="20,6 9,17 4,12" />
  </Outline>
);

export const ShieldIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Outline>
);

export const AlertTriangleIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Outline>
);

/** lucide `plug` */
export const PlugIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M12 22v-5" />
    <Path d="M9 8V2" />
    <Path d="M15 8V2" />
    <Path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
  </Outline>
);

export const Volume2Icon = (props: IconProps) => (
  <Outline {...props}>
    <Polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
    <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </Outline>
);

export const UsersIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Outline>
);

export const PlusIcon = (props: IconProps) => (
  <Outline {...props}>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Outline>
);

export const EditIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Outline>
);

export const TrashIcon = (props: IconProps) => (
  <Outline {...props}>
    <Polyline points="3,6 5,6 21,6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Outline>
);

export const LogOutIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16,17 21,12 16,7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Outline>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Outline {...props}>
    <Polyline points="18,15 12,9 6,15" />
  </Outline>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Outline {...props}>
    <Polyline points="6,9 12,15 18,9" />
  </Outline>
);

export const InfoIcon = (props: IconProps) => (
  <Outline {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </Outline>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Outline {...props}>
    <Polyline points="9,18 15,12 9,6" />
  </Outline>
);

/* ---- bottom tab icons (outline) ---- */

export const HomeIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
  </Outline>
);

export const LocationPinIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Outline>
);

export const BellIcon = (props: IconProps) => (
  <Outline {...props}>
    <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Outline>
);

export const SettingsIcon = (props: IconProps) => (
  <Outline {...props}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Outline>
);

export const GoogleIcon = ({ size }: Pick<IconProps, 'size'>) => {
  const theme = useTheme();
  const dimension = size ?? theme.sizing.iconMd;
  return (
    <Svg width={dimension} height={dimension} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
};

export const AppleIcon = ({ size, color }: IconProps) => {
  const theme = useTheme();
  const dimension = size ?? theme.sizing.iconMd;
  return (
    <Svg width={dimension} height={dimension} viewBox="0 0 24 24">
      <Path
        fill={color ?? theme.colors.text}
        d="M17.05 12.53c-.02-2.26 1.85-3.35 1.93-3.4-1.05-1.54-2.69-1.75-3.27-1.77-1.39-.14-2.72.82-3.43.82-.71 0-1.8-.8-2.96-.78-1.52.02-2.92.88-3.71 2.24-1.58 2.74-.4 6.8 1.14 9.02.75 1.09 1.65 2.31 2.83 2.27 1.14-.05 1.57-.73 2.94-.73 1.37 0 1.76.73 2.96.71 1.22-.02 2-1.11 2.75-2.2.87-1.26 1.22-2.48 1.24-2.55-.03-.01-2.38-.91-2.4-3.63zM14.8 5.9c.63-.76 1.05-1.82.94-2.87-.9.04-1.99.6-2.64 1.36-.58.67-1.09 1.75-.95 2.78 1 .08 2.02-.51 2.65-1.27z"
      />
    </Svg>
  );
};
