import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <select
      onChange={changeLanguage}
      className="text-primary-yellow border-none bg-transparent"
    >
      <option value="en">EN</option>
      <option value="vi">VI</option>
    </select>
  );
};

export default LanguageSelector;
