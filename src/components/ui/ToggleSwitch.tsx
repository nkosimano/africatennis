import React from 'react';
import { Switch } from '@headlessui/react';

interface ToggleSwitchProps {
  label: string;
  onChange: (enabled: boolean) => void;
  initialEnabled?: boolean;
}

export function ToggleSwitch({ label, onChange, initialEnabled = false }: ToggleSwitchProps) {
  const [enabled, setEnabled] = React.useState(initialEnabled);

  const handleChange = (value: boolean) => {
    setEnabled(value);
    onChange(value);
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        onChange={handleChange}
        className={`${
          enabled ? 'bg-accent' : 'bg-surface'
        } relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none`}
      >
        <span
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-1'
          } inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out mt-1`}
        />
      </Switch>
      <span className="text-sm whitespace-nowrap hidden sm:inline">{label}</span>
    </div>
  );
}