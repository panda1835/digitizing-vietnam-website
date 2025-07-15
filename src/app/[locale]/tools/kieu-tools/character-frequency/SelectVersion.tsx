"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SelectVersion = ({ currentVersion }: { currentVersion: string }) => {
  const router = useRouter();
  const t = useTranslations();
  const handleVersionChange = (value: string) => {
    router.push(`/tools/kieu-tools/character-frequency/${value}`);
  };
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-2xl text-branding-brown font-['Helvetica Neue'] ">
        {t("Tools.kieu-tools.tools.glossary.version")}:
      </span>
      <div className="w-32">
        <Select
          defaultValue={`${currentVersion}`}
          onValueChange={handleVersionChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1866">1866</SelectItem>
            <SelectItem value="1870">1870</SelectItem>
            <SelectItem value="1871">1871</SelectItem>
            <SelectItem value="1872">1872</SelectItem>
            <SelectItem value="1902">1902</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SelectVersion;
