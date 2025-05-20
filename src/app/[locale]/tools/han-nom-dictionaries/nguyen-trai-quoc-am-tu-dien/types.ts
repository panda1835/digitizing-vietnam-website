type GDNVHVDictionaryEntry = {
  uni: string;
  qn: string;
  pinyin: {
    origin: {
      _: string;
      $: {
        lang: string;
      };
    };
  };
  text: {
    sense_area: {
      $: {
        lang: string;
      };
      sense:
        | {
            _: string;
            cit: string[];
          }[]
        | string[];
    };
  };
};
