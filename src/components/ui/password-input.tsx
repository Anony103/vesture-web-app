"use client";
import { useState } from "react";
import { Input, type InputProps } from "./input";
import { Button } from "./button";
import { AssetIcon } from "./asset-icon";
export function PasswordInput(props: Omit<InputProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <Button
          size="icon"
          variant="ghost"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="-mr-2"
        >
          <AssetIcon
            name={visible || props.variant === "filled" ? "eye" : "eye-off"}
          />
        </Button>
      }
    />
  );
}
