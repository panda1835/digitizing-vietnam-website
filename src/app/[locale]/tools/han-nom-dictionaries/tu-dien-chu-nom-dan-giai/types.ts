type Definition = string | { $: { ref: string }; _: string };
type Citation = {
  passage: {
    source_text: string[];
    transliteration: string[];
  }[];
  reference_list: {
    reference: string[];
  }[];
};
type DictionaryEntry = {
  hn: string[];
  qn: string[];
  derivations: {
    sense_list: {
      $: {
        struct: string;
      };
      sense: {
        $: {
          type: string;
        };
        def: Definition[];
        source_list: {
          citation: Citation[];
        };
      }[];
    }[];
  }[];
};

type Reference = {
  details: {
    desc: string[];
    full_title: string[];
    hn_title: string[];
  }[];
  short_title: string[];
};
