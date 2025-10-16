"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

type InputMethod = "quoc-ngu" | "handwriting" | "radical";

interface InputMethodSelectorProps {
  value: InputMethod;
  onChange: (value: InputMethod) => void;
}

export default function InputMethodSelector({
  value,
  onChange,
}: InputMethodSelectorProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        {t(
          "Tools.han-nom-tools.tools.han-nom-input-method-editor.input-method"
        )}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quoc-ngu">
            {t(
              "Tools.han-nom-tools.tools.han-nom-input-method-editor.quoc-ngu"
            )}
          </SelectItem>
          <SelectItem value="handwriting">
            {t(
              "Tools.han-nom-tools.tools.han-nom-input-method-editor.handwriting"
            )}
          </SelectItem>
          <SelectItem value="radical">
            {t("Tools.han-nom-tools.tools.han-nom-input-method-editor.radical")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
