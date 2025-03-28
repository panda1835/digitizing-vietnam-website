export type TruyenKieuRaw = {
  // This is the type definition for the raw data
  // that contains the info of notes inside each line
  $: {
    n: string;
    pi: string;
  };
  div: [
    {
      $: { type: string; lang: string };
      lg: {
        l: {
          $: { n: string };
          _: string;
        }[];
      }[];
    },
    {
      $: { type: string; lang: string };
      lg: {
        l: {
          $: { n: string };
          _: string;
          seg: {
            $: { id: string; corresp: string };
            _: string;
          }[];
        }[];
      }[];
    }
  ];
  noteg: {
    note: {
      $: { id: string; target: string };
      _: string;
    }[];
  }[];
};

export type TruyenKieuText = {
  // This is the type definition for the text data
  // that does not contains the info of notes
  // in order to render each line completely.
  // Otherwise, it will be too complicated to render
  // the notes in the text because the note are segmented.
  $: {
    n: string;
    pi: string;
  };
  div: [
    {
      $: { type: string; lang: string };
      lg: {
        l: {
          $: { n: string };
          _: string;
        }[];
      }[];
    },
    {
      $: { type: string; lang: string };
      lg: {
        l: {
          $: { n: string };
          _: string;
        }[];
      }[];
    }
  ];
  noteg: {
    note: {
      $: { id: string; target: string };
      _: string;
    }[];
  }[];
};
