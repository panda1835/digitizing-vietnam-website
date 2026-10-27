// src/app/[locale]/our-collections/vietnamese-edicts/_data/PennStateEdictsMetadata.ts
//
// GENERATED FILE — do not edit by hand.
// Run: node scripts/collections/fetch-pennstate-edicts.mjs
//
// Snapshot of Penn State University Libraries' "Collection of Vietnamese Edicts
// and Official Documents" (CONTENTdm collection "vietscrolls"), held by the Eberly
// Family Special Collections Library.
//
// Rights: http://rightsstatements.org/vocab/NoC-US/1.0/ (No Copyright – US).
// Scans are not mirrored; item pages load PSU's IIIF directly.
//
// Snapshot taken: 2026-08-20

export interface PennStateEdictRecord {
  /** CONTENTdm parent record id — the stable identifier used in DVN URLs. */
  dmrecord: number;
  title: string;
  /** Derived from the title: Edict, Promotion, Military, Appointment, … */
  documentType: string;
  /** Derived: "Lê" or "Nguyễn". */
  dynasty: string;
  /** Derived reign era, e.g. "Tự Đức". */
  era: string;
  date: string;
  year: number | null;
  /** Date as counted in the Vietnamese calendar, e.g. "1-3-22". */
  vietnameseDate: string;
  dateNotes: string;
  creator: string;
  contributor: string;
  description: string;
  notes: string;
  physical: string;
  subjects: string[];
  place: string;
  language: string;
  repository: string;
  container: string;
  rights: string;
  identifier: string;
  /** Full Hán transcript of the document, where PSU recorded one. */
  transcript: string;
  /** PSU's notes on damage or illegible characters. */
  transcriptNotes: string;
  /** CONTENTdm child pointers — the IIIF image service is keyed on these. */
  imagePointers: number[];
  manifestUrl: string;
  thumbnailUrl: string;
  permalinkUrl: string;
}

export const PENN_STATE_EDICTS: ReadonlyArray<PennStateEdictRecord> = [
  {
    "dmrecord": 27,
    "title": "Edict from the Dương Hòa (陽和) era of the Lê dynasty",
    "documentType": "Edict",
    "dynasty": "Lê",
    "era": "Dương Hòa",
    "date": "1638",
    "year": 1638,
    "vietnameseDate": "4-5-25",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Lê Thần Tông",
    "contributor": "",
    "description": "This edict bestows four beautifying characters to a deity; it was issued on the 25th day of the 5th month of the 4th year of the first reign of Lê Thần Tông (黎神宗).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on yellow paper and features a dragon and cloud in silver ink along with the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Later Lê dynasty, 1428-1787",
      "Later Lê dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "pstsc_10178_d9fb888770e161f875e193b1ec8f64b7",
    "identifier": "pstsc_10178_d9fb888770e161f875e193b1ec8f64b7",
    "transcript": "𠡠東榜大王，資兼正直，德禀聰明，得二氣之精英，升騰叵測；扶億年之宗社，悠乆無疆。既多相佑之功，宜舉褒封之典。為稔有靈驗，扶護感應有功，應加封，可加封東榜感應扶祚大王，故𠡠。陽和四年五月二十五日\nSeal：敕命之寶",
    "transcriptNotes": "For the characters in the edicts, the transcription attempts to reflect the original character forms. \nWhen a handwritten variant can be input, it is displayed in its original form. \nWhen a handwritten variant cannot be input, the standard character is used instead.\n□ is used to indicate an unreadable, or unidentifiable character, or a Chữ Nôm that cannot be input.",
    "imagePointers": [
      26
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:27/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:26/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/27"
  },
  {
    "dmrecord": 43,
    "title": "Edict from the Cảnh Hưng (景興) era of the Lê dynasty",
    "documentType": "Edict",
    "dynasty": "Lê",
    "era": "Cảnh Hưng",
    "date": "1743",
    "year": 1743,
    "vietnameseDate": "4-5-21",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Lê Hiển Tông",
    "contributor": "",
    "description": "This edict bestows three beautifying characters to a deity; it was issued on the 21st day of the 5th month of the 4th year of the reign of Lê Hiển Tông (黎顯宗).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on yellow paper and features a dragon and a pearl drawn in brown ink. It includes the the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Later Lê dynasty, 1428-1787",
      "Later Lê dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_39d5fc7cd8c369f279e7dcc496142dcd",
    "transcript": "敕當境城隍當河輔國冲應弘恩垂休顯靈翊運才明勇畧䕶國保民厚德至仁䕶國安民捍災禦患澤國福民匡國福佑揚武扶祚靖肅聰明莊正普惠宠休綏祿顯德豐功綏慶聰明英靈護國扶運揚武衛國康民賛治敷威豁達大度神武䧺豪英毅建謀匡𨐓翼聖仁聖盛明至德洪恩英敏博達孚化嘉惠明肅睿智肫信䧺風宣義英靈集福俊德昭烈顯靈孚感聖神美大大王，四瀆儲精，兩儀交泰，高配天厚配地，玄化茂参，功在國德在民，冥機默運。在昔旣加𡽪顯號，今當載播顯稱。為嗣位在初，禮當登秩，應加封美字三字，可加封當境城隍當河輔國沖應孚感弘恩垂休顯靈翊運才明勇畧護國保民厚德至仁護國安民捍災禦患澤國福民匡國福祐揚武扶祚靖肅聰明莊正普惠宠休綏祿顯德豐功綏（功）慶聰明英靈護國扶運揚武衛國康民賛治敷威豁達大度神武䧺豪英毅建謀匡𨐓翊聖仁聖盛明至德洪恩英敏博達孚化[嘉惠]睿智肫信䧺風宣義英靈集福峻德昭烈顯靈孚感聖神美大英威顯（靈）應延祥大王，故敕。景興四年五月二十一日\nSeal：敕命之寶",
    "transcriptNotes": "This edict contains evidence of scribal revision. \nThe character 休, 國, 扶, and 在 appear as marginal insertions, written either to the right of the main text or above the line in smaller script. These characters were omitted in the initial writing and added later by the scribe. In the transcription, they are displayed in a small font size.\nTo the right of the character 功 and 靈, the annotation 餘字 appears in the manuscript, indicating that these characters are redundant. In the transcription, this redundancy is represented using parentheses: （功）and（靈）.\nTwo small annotations 下 and上 appear to the right of惠 and 嘉, respectively, indicating their relative vertical order, with嘉 positioned above 惠. This relationship is transcribed as [嘉惠].",
    "imagePointers": [
      42
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:43/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:42/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/43"
  },
  {
    "dmrecord": 9,
    "title": "Edict from the Cảnh Hưng (景興) era of the Lê dynasty",
    "documentType": "Edict",
    "dynasty": "Lê",
    "era": "Cảnh Hưng",
    "date": "1783",
    "year": 1783,
    "vietnameseDate": "44-7-26",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Lê Hiển Tông",
    "contributor": "",
    "description": "This edict bestows three beautifying characters to the name of a deity; it was issued on the 26th day of the 7th month of the 44th year of the reign of Lê Hiển Tông (黎顯宗).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on yellow paper and features a dragon and cloud in silver ink. It includes the the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Later Lê dynasty, 1428-1787",
      "Later Lê dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_3aa5f6af9449273e0d0195fc75c79b8e",
    "transcript": "𠡠烈祖靈應□護彰武昭信□仁顕忠明肅㳟惠文敏荘懿䧺剛簡亮保定孚佑綏福弘休廣化光泰靖通元迪孚慶剛直助福翊善靖□佐治宣捷揚武佑民翊運匡國賛治協謀佐𨐓威勇英毅果□弼康弘恩濟勝安民達度䧺材顕績奮威廣量容物安民英敏特達弘公著德強毅聰察正直中和靈顕忠懿宏休溥澤盛德至仁勇國公宏度大王，光岳降神，海山孕秀，尊德樂道保民多物阜人康，錫嘏垂休護國等天長地乆，諒顕應既彰於膠水，信褒封宜冠於南山。為嗣王進封王位，臨居正府，禮有登秩，應加封羙字叄字，可加封烈祖靈應□護彰武昭信□仁顕忠明肅㳟惠文敏荘懿䧺剛簡亮保定孚佑綏福弘休廣化光泰靖通元迪孚慶剛直助福翊善靖□佐治宣捷揚武佑民翊運匡國賛治協謀佐𨐓威勇英毅果□弼康弘恩濟衆助勝安民達度䧺材顕績奮威廣量容物安民英敏特達弘公著德強毅聰察正直中和靈顕忠懿宏休溥澤盛德至仁扶祚衍福綏祿勇國公宏度大王，故𠡠。景興四十四年七月二十六日\nSeal：敕命之寶",
    "transcriptNotes": "Note (verso): \nThe address膠水縣樂道社 appears twice.\nThe two seals bear identical inscriptions:一路福星 \nAdditional characters appear after the second seal 一路福星. They appear to read已 □ .",
    "imagePointers": [
      8
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:9/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:8/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/9"
  },
  {
    "dmrecord": 7,
    "title": "Edict from the Chiêu Thống (昭統) era of the Lê dynasty",
    "documentType": "Edict",
    "dynasty": "Lê",
    "era": "Chiêu Thống",
    "date": "1787",
    "year": 1787,
    "vietnameseDate": "1-3-22",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Lê, Chiêu Thống, King of Vietnam, 1766-1793",
    "contributor": "",
    "description": "This edict bestows two beautifying characters to the title of a female deity; it was issued on the 22nd day of the 3rd month of the 1st year of the reign of Lê Mẫn Đế (黎愍帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on bown paper and features a dragon and cloud in dark ink. The the red imperial seal, Sắc mệnh chi bảo (敕命之寶), is present.",
    "subjects": [
      "Vietnam--History--Later Lê dynasty, 1428-1787",
      "Later Lê dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "pstsc_10178_359265d446b34ad7255ad861bbaf86f3",
    "identifier": "pstsc_10178_359265d446b34ad7255ad861bbaf86f3",
    "transcript": "𠡠□天香艷冶華麗□閒太后，蘭蕙仙容，瑀珩懿爍，光貞順坤，□于千古，袵席康闔境之民，翊穆清乾，禦于一人，泰磐壽穹圖之脉，登秩既稽常典，推覃載□華章。為黙相皇家穹圖復正，禮當登秩，應加封羙字二字，可加封□天香艷冶華䴡□閒竒姿艷色太后，故𠡠。昭統元年三月二十二日\nSeal：敕命之寶",
    "transcriptNotes": "The address 淳祿縣翼東社 is written on the verso.",
    "imagePointers": [
      6
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:7/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:6/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/7"
  },
  {
    "dmrecord": 21,
    "title": "Edict from the Chiêu Thống (昭統) era of the Lê dynasty",
    "documentType": "Edict",
    "dynasty": "Lê",
    "era": "Chiêu Thống",
    "date": "1787",
    "year": 1787,
    "vietnameseDate": "1-3-22",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Lê, Chiêu Thống, King of Vietnam, 1766-1793",
    "contributor": "",
    "description": "This edict bestows three beautifying characters to the name of a deity; it was issued on the 22nd day of the 3rd month of the 1st year of the reign of Lê Mẫn Đế (黎愍帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This edict is printed on red paper and features a dragon and a cloud in dark ink. It includes the the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Later Lê dynasty, 1428-1787",
      "Later Lê dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_16ac53717a04416591a1bd87afffde34",
    "transcript": "𠡠顕宮[紅娘浄]行芳蓉端荘淳羙[謹節行和]□ □保護安民管察[明聰]登光敬懿仁慈[節行靈感]敷威[宣烈]貴妃第一公主，□承□□□□□□運玄□□捍患禦灾磐□□□□□□□□□協□□□□□□頓息□□□□□□□□神功盍□□□之盛典。為黙相皇[家]窮圖復正，禮當登秩，應加封羙字三字，可[加封]顕宮紅娘浄行芳蓉端荘淳羙謹節行和□□保護安民管察明聰登光敬懿仁慈節行靈感敷威宣烈柔和溫厚□□貴妃第一公主，故[𠡠]。昭統元年三月二十二日\nSeal：敕命之寶",
    "transcriptNotes": "This edict is damaged, and some characters are missing.\n[Character] indicates characters missing from the edict that have been supplied based on the surrounding text.",
    "imagePointers": [
      20
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:21/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:20/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/21"
  },
  {
    "dmrecord": 57,
    "title": "Edict from the Gia Long (嘉隆) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Gia Long",
    "date": "1810",
    "year": 1810,
    "vietnameseDate": "9-6-15",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Gia Long, Emperor of Vietnam, 1762-1820",
    "contributor": "",
    "description": "This edict bestows three beautifying characters to the name of a deity worshipped in Huyện Thanh Oai (Hanoi). It was issued on the 15th day of the 6th month of the 9th year of the reign of Gia Long Đế (嘉隆帝), the first emperor of the Nguyễn dynasty",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on yellow paper and features a dragon and pearls draw in grey ink. There is no imperial seal.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_fa0b7002b38d7ef10339dc48bfe21c3e",
    "transcript": "敕那洞普湤桓赫壮烈神威□默荘肅浩蕩寬弘博達渊□敢通顕應妙運聴玄信善羙大聖神普濟靈通保佑深仁閏澤普㤙大王，原属正神，係青威縣早陽社從前奉事，經有歷朝褒贈，兹國家輿圖混一，禮有登秩，可加贈羙字三字，曰垂休寬和正直大王，故敕。嘉隆玖年陸月拾五日",
    "transcriptNotes": "No seal present.",
    "imagePointers": [
      56
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:57/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:56/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/57"
  },
  {
    "dmrecord": 41,
    "title": "Edict from the Minh Mạng (明命) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Minh Mạng",
    "date": "1821",
    "year": 1821,
    "vietnameseDate": "2-12",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Minh Mệnh, King of Vietnam, 1791-1840",
    "contributor": "",
    "description": "This edict bestows three beautifying characters to the title of a deity.",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on yellow paper and features a dragon and phoenix in silver ink and a cloud in dark ink; it does not have an imperial seal.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_4dd8ff913f4f34c8c5efdf7672419832",
    "transcript": "𠡠峭峨顕德豊功肇謀佐𨐓䧺才偉績剛□威勇篤弼普化宏休翊運護國濟民明義布德陳威聰明正直才兼德備耀靈純格齊聖廣渊明允篤實寬信敏德顕慶孚佑溫厚才畧錫嘏延澤孚休莊肅熈穆顕功大王，乃聖乃神，最靈最粹，崧嶺初鍾，灝氣儼然騎鶴之踪，崇祠稔賁，英殾耸若乘驂之望，相佑實弘靈德，褒崇載賁舊章。為皇家肇造洪圖，禮有登秩，應加封羙字三字，可加封峭峨顕德豊功肇謀佐𨐓䧺才偉績剛□威勇篤弼普化宏休翊運護國濟民明義布德陳威聰明正直才兼德備耀灵純格齊聖廣渊明允篤實寬信敏德顕慶孚佑溫厚才畧錫嘏延澤孚休荘肅熈穆顕功体元含章揚烈大王，故𠡠。明命二年十二月五重冬",
    "transcriptNotes": "No seal present.",
    "imagePointers": [
      40
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:41/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:40/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/41"
  },
  {
    "dmrecord": 55,
    "title": "Edict from the Minh Mạng (明命) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Minh Mạng",
    "date": "1824",
    "year": 1824,
    "vietnameseDate": "5-2-11",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Minh Mệnh, King of Vietnam, 1791-1840",
    "contributor": "",
    "description": "This edict promotes a dragon deity to a mid-ranked deity.",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is printed on yellow paper and features a dragon and cloud in silver ink; the the red imperial seal, Sắc mệnh chi bảo (敕命之寶), is included. It was issued on the 11th day of the 2nd month of the 5th year of the reign of Minh Mạng Đế (明命帝).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_4493300cbd61c6b582be7151c7e2e31c",
    "transcript": "敕三郎龍王護國庇民，顯有功德，經有社民奉事，奉我世祖高皇帝統一海宇，慶被神人，肆今光紹鴻圖，緬念神庥，宜隆顯號，可加贈仁霑㤙洽中等神，仍準許禾多縣甘海村依舊奉事，神其相佑，保我黎民，欽哉。明命五年貳月拾壹日\nSeal：封贈之寶",
    "transcriptNotes": "",
    "imagePointers": [
      54
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:55/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:54/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/55"
  },
  {
    "dmrecord": 23,
    "title": "Promotion document from the Minh Mạng (明命) era of the Nguyễn dynasty",
    "documentType": "Promotion document",
    "dynasty": "Nguyễn",
    "era": "Minh Mạng",
    "date": "1838",
    "year": 1838,
    "vietnameseDate": "19-9-29",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "",
    "contributor": "",
    "description": "This document was issued by ministry of war promotes military officials; it was issued on the 29th day of the 9th month of the 19th year of the reign of Minh Mạng Đế (明命帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This document is written on plain white paper and has the red seal of the ministry of war, Binh Bộ chi ấn (兵部之印).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_5fa0febd2ccca0583bf192678919fae1",
    "transcript": "[…]建安公府摺將府[屬]正捌品書吏黃文森請陞補右[武]壹隊正隊長率隊等因，欽奉[明]旨，黃文森原係捌品書吏，兹請陞授正隊長率隊，頗屬踰等，黃文森著改授右武壹隊隊長，試差正隊長率伊隊，黃文森改為黃文峯等因，欽此。欽遵合行憑給，宜倡率內隊弁兵，從該府奉行諸公務。若所事弗勤，有公法在。須至憑給者  右憑給  右武壹隊隊長試差正隊長率隊黃文峯執照。明命拾玖年玖月貳拾玖日\nSeal：兵部之印\nSmall red seals: 兵部 \nSignature (lower left corner):  阮□奉考",
    "transcriptNotes": "[…] indicates an unknow number of missing characters at the beginning of the document.\n[character] indicates a character that is missing or partially missing but can be identified.\n□ marks characters that cannot be identified. \nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      22
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:23/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:22/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/23"
  },
  {
    "dmrecord": 47,
    "title": "Promotion document from the Minh Mạng (明命) era of the Nguyễn dynasty",
    "documentType": "Promotion document",
    "dynasty": "Nguyễn",
    "era": "Minh Mạng",
    "date": "1840",
    "year": 1840,
    "vietnameseDate": "21-4-15",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Minh Mệnh, King of Vietnam, 1791-1840",
    "contributor": "",
    "description": "This document was issued for the promotion of a military official; it was issued on the 15th day of the 4th month of the 21st year of the reign of Minh Mạng Đế (明命帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The promotion is on plain white paper and has the the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_c35c5e59542e6b74c7c59eacdf4dfb68",
    "transcript": "[敕右]武壹隊[試差]正隊長率隊黃文峯，□軍年深，頗屬敏幹。兹建安公聲請[保]舉具題，準爾實授伊隊正隊長，率內隊弁兵，從該親公府分派公務，若厥職弗虔，有軍政在，欽哉。明命貳拾壹年肆月拾五日\nSeal：敕命之寶",
    "transcriptNotes": "[character] indicates a character that is either missing and supplied based on parallel examples in other edicts, or partially missing but identifiable.",
    "imagePointers": [
      46
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:47/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:46/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/47"
  },
  {
    "dmrecord": 39,
    "title": "Appointment document from the Thiệu Trị (紹治) era of the Nguyễn dynasty",
    "documentType": "Appointment document",
    "dynasty": "Nguyễn",
    "era": "Thiệu Trị",
    "date": "1842",
    "year": 1842,
    "vietnameseDate": "2-9-25",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Thiệu Trị, King of Vietnam, 1807-1847",
    "contributor": "",
    "description": "This document appoints officials within the royal guards; it was issued on the 25th day of the 9th month of the 2nd year of the reign ofThiệu Trị Đế (紹治帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The document is plain white paper and has the red seal of the royal guards, Loan giá vệ đồ ký (鑾駕衛圖記). There are smaller Loan giá (鑾駕) seals in the text.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_b54c226f21307f726f9d68fb3aa4ffe0",
    "transcript": "銮驾□□□宗室䏻  為憑給事。照得標內□□□□□黃文綱投軍有年，頗䏻敏幹，𦀰彚册聲請，充伊司外委隊長，承辦公務等因具題。□月日奉旨內壹欵，黃文綱準給憑充伊司外委隊長，欽此。欽遵輒此合行憑給，為伊司外委隊長，率伊司兵，從率司貟差派公務，若所事弗勤，有軍政在。須至憑給者  右憑給  鑾駕衛旗鼓司外委隊長黃文綱準此。紹治貳年玖月貳拾五日\nSeal: 鑾駕衛圖記\nSmall red seals: 鑾駕",
    "transcriptNotes": "□ marks characters are missing or partially missing and cannot be identified. \nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      38
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:39/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:38/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/39"
  },
  {
    "dmrecord": 35,
    "title": "Appointment document from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Appointment document",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1849",
    "year": 1849,
    "vietnameseDate": "2-6-16",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "",
    "contributor": "",
    "description": "This document was issued by the ministry of war for the appointment of a military official. It was issued on the 16th day of the 6th month of the 2nd year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The document is on plain white paper and features the red seal of the ministry of war, Binh Bộ chi ấn (兵部之印).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_daaa32817e95f5a06d59fbf6f9e45d5f",
    "transcript": "兵部為憑給事。照得後保壹衛衛尉阮尹，前𦀰派徃廣平省護接使務，兹該員蒙補清化省領兵□□，應撥派他員換辦，嗣㨿武班大臣遴派安幹管衛尊室直前徃換代等語。輒此合行憑給，宜前徃廣平省城聽洪署掌衛，權掌耆武营印務，兼管選鋒兵，承恩尉新靖男陳知分派奉行，務期週安。須至憑給[者]  右憑給  神機营中衛署衛尉尊室直㨿此。嗣德貳年陸月拾陸日\nSeal: 兵部之印\nLarge seal (center): 兵部之印\nTwo small red seals: 兵部 \nSignature (lower left corner):  □考",
    "transcriptNotes": "□ marks characters that cannot be identified.\n[character] indicates a character that is partially missing but can be identified. \nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      34
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:35/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:34/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/35"
  },
  {
    "dmrecord": 53,
    "title": "Promotion document from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Promotion document",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1849",
    "year": 1849,
    "vietnameseDate": "2-1-18",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Tự Đức, King of Vietnam, 1829-1883",
    "contributor": "",
    "description": "This document promotes a military official within the royal guards. It was issued on the 18th day of the 1st month of the 2nd year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The document is on plain white paper and has the the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_9fab269c67f514f9d8f381a0868dd890",
    "transcript": "[敕]鑾[駕]衛旗鼓司隊長黃綱，投軍年深，頗能敏幹。兹該管員擇舉具題，[準爾]陞授伊司正隊長，率內隊弁兵，從該管員分派公務，若厥職弗虔，有軍政在，欽哉。嗣德貳年正月拾捌日\nSeal：敕命之寶",
    "transcriptNotes": "[character] indicates a character that is either missing and supplied based on parallel examples in other edicts, or partially missing but identifiable.",
    "imagePointers": [
      52
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:53/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:52/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/53"
  },
  {
    "dmrecord": 19,
    "title": "Edict from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1853",
    "year": 1853,
    "vietnameseDate": "6-1-11",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Tự Đức, King of Vietnam, 1829-1883",
    "contributor": "",
    "description": "This edict bestows a title on a deity in the Sơn Tây province. It was issued on the 11th day of the 1st month of the 6th year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on yellow paper and features a dragon and pearl in silver ink; it includes the the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_593e7c6623cd627d6e1a5cccd8758e51",
    "transcript": "敕山西省美良縣順良社順良村，原祀神號，未有預封。肆今丕膺耿命，覃布㤙霑，特準給予城隍之神敕文壹道，贈為本境城隍靈扶之神，仍準該村奉事，神其相佑，保我黎民，欽哉。嗣德陸年正月拾壹日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      18
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:19/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:18/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/19"
  },
  {
    "dmrecord": 37,
    "title": "Military document from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Military document",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1868",
    "year": 1868,
    "vietnameseDate": "21-4-10",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "",
    "contributor": "",
    "description": "This document discusses military affairs and was issued by the ministry of war. It was issued on the 10th day of the 4th month of the 21st year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This signed document is handwritten in cursive on plain white paper. The red seal of the ministry of war, Binh Bộ chi ấn (兵部之印), appears throughout.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_f17ac6309592e69772be37ba99ccac06",
    "transcript": "兵部為憑給事。兹本部片将護衛司護衛長尊室廡請陞授北寧右威奇玖隊該隊等因，月前初壹日欽蒙準允在案，輒此憑給，宜前徃该省呈知省安便就供职，所召带隨從者五人，並咱通行。須至憑給者  右憑給  北寧右威奇玖隊该隊尊室廡拠此。嗣德貳拾壹年閏肆月初拾日\nSeal: 兵部之印\nSmall red seals: 兵部\nSignature (lower left corner):  潘□奉考",
    "transcriptNotes": "□ marks characters that cannot be identified.\nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      36
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:37/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:36/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/37"
  },
  {
    "dmrecord": 25,
    "title": "Military document from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Military document",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1871",
    "year": 1871,
    "vietnameseDate": "24-3-19",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Tự Đức, King of Vietnam, 1829-1883",
    "contributor": "",
    "description": "This is a document regarding military affairs. It was issued on the 19th day of the 3rd month of the 24th year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This document is handwritten in cursive on plain white paper. The red seal of the Tổng đốc of Ninh Thái (Bắc Ninh Thái Nguyên Tổng đốc quan phòng 北寧太原總督關防) appears throughout.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_77684c32756f5c76c6c04a4793544cb1",
    "transcript": "寧太護督裴  為權給事。照得後勝奇管员缺壹，差派需人。经商同，查有该员身材强幹，武艺稍谙，派辦颇属得力，可堪充缺。除另奉摺遞外，合给權充伊奇協管，叶同副管奇林登贵唱率奇内弁兵，随统領员差派諸公務，要宜著力承行，俟遞摺得旨□飭遵奉。須至權给者  右權给  後勝奇该隊權充叶管尊室廡準此。嗣德貳拾肆年叄月拾玖日\nSeal: 北寧太原總督關防\nSmall red seals: 寧太總督",
    "transcriptNotes": "□ marks characters that cannot be identified.\nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      24
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:25/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:24/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/25"
  },
  {
    "dmrecord": 49,
    "title": "Military document from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Military document",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1871",
    "year": 1871,
    "vietnameseDate": "24-9-28",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Tự Đức, King of Vietnam, 1829-1883",
    "contributor": "",
    "description": "This is a document regarding military affairs. It was issued on the 28th day of the 9th month of the 24th year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This document is handwritten in cursive on plain white paper. The red seal of the Tổng đốc of Ninh Thái (Bắc Ninh Thái Nguyên Tổng đốc quan phòng 北寧太原總督關防) appears throughout.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_a607af92bde15077454a8272e5f39ede",
    "transcript": "北寧巡撫護理寧太總督關防裴  為權給事。照得勝場武生管员林登贵現病，照管需人。经㨿副領员遴夆该员堪管。所应派辦合行權给，以現銜兼充该武生奇叶管，督同率隊等员，□□该武生兵，辰加训练，務使技藝咸精，以資幹派。若所事弗勤，有軍政在。須至權给者  右權给  後勝奇管员兼充武生奇叶管尊室廡準此。嗣德貳拾肆年玖月貳拾捌日\nSeal: 北寧太原總督關防\nSmall red seals: 寧太總督",
    "transcriptNotes": "□ marks characters that cannot be identified.\nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      48
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:49/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:48/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/49"
  },
  {
    "dmrecord": 13,
    "title": "Military document from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Military document",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1876",
    "year": 1876,
    "vietnameseDate": "29-9-19",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Tự Đức, King of Vietnam, 1829-1883",
    "contributor": "",
    "description": "This is a document regarding military affairs. It was issued on the 19th day of the 9th month of the 29th year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This document is handwritten in cursive on plain white paper. The red seal of the Tổng đốc of Ninh Thái (Bắc Ninh Thái Nguyên Tổng đốc quan phòng 北寧太原總督關防) appears throughout.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_009289e24b73ce0b39598108dbc1c2bb",
    "transcript": "署巡撫護理寧太總督關防黎  為錄給事。本年闰五月日在省摺将標屬武员折请陞秩各理，间有禁兵该隊充後勝奇協管尊室廡请陞授伊奇管奇，月前貳拾陆日接兵部恭錄柒月拾貳日欽奉旨：“依奏，欽此。”錄辦等因。除另照會副领兵官知照外，合行錄給该员。遵奉须至录者  右錄给  後勝奇管奇尊室廡尊遵奉。嗣德貳拾玖年玖月拾玖日\nSeal: 北寧太原總督關防\nSmall red seals: 寧太總督",
    "transcriptNotes": "Double spaces are used to reflect the format of the document.",
    "imagePointers": [
      12
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:13/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:12/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/13"
  },
  {
    "dmrecord": 17,
    "title": "Transfer document from the Tự Đức (嗣德) era of the Nguyễn dynasty",
    "documentType": "Transfer document",
    "dynasty": "Nguyễn",
    "era": "Tự Đức",
    "date": "1879",
    "year": 1879,
    "vietnameseDate": "32-3-6",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Tự Đức, King of Vietnam, 1829-1883",
    "contributor": "",
    "description": "This is a document arranging the transfer of personnel. It was issued on the 6th day of the 3rd month of the 32nd year of the reign of Tự Đức Đế (嗣德帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This document is written on plain white paper and features the red seal of the ministry of personnel, Lại Bộ chi ấn (吏部之印).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 01",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_47427055c38e15f18b19e34f8a8ab912",
    "transcript": "吏部  为遵錄事。照得侍講學士領北寧省按察使裴璞奉準以原銜陞領太原省布政使等因。輙此遵錄，發交執照。須至遵錄者  右遵錄  侍講學士領太原省布政使裴貴職執照。嗣德叄拾貳年閏叄月初陸日\nSeal: 吏部之印\nSmall red seals: 吏部",
    "transcriptNotes": "Double spaces are used to reflect the format of the document.",
    "imagePointers": [
      16
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:17/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:16/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/17"
  },
  {
    "dmrecord": 51,
    "title": "Edict from the Đồng Khánh (同慶) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Đồng Khánh",
    "date": "1887",
    "year": 1887,
    "vietnameseDate": "2-7-1",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Đồng Khánh",
    "contributor": "",
    "description": "This edict bestows titles on a deity local to Huyện Phú Xuyên (Hanoi). It was issued on the 1st day of the 7th month of the 2nd year of the reign of Đồng Khánh Đế (同慶帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on plain yellow paper and has the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_34dfc8b26f107cad7bacf1e39a9fd797",
    "transcript": "敕昭格妙感孚靈端肅靈光之神，向來護國庇民，稔著靈應，節蒙頒給贈敕留祀，肆今丕膺耿命，緬念神庥，可加贈翊保中興之神，仍準許河內省富川縣洹陽社上村依舊奉事，神其相佑，保我黎民，欽哉。同慶貳年柒月初壹日\n敕俊良黎進楚之神、俊良黃進秦之神，向來護國庇民，稔著靈應，節蒙頒給贈敕留祀，肆今丕膺耿命，緬念神庥，可加贈翊保中興之神，仍準許河內省富川縣洹陽社依舊奉事，神其相佑，保我黎民，欽哉。同慶貳年柒月初壹日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      50
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:51/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:50/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/51"
  },
  {
    "dmrecord": 59,
    "title": "Edict from the Đồng Khánh (同慶) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Đồng Khánh",
    "date": "1887",
    "year": 1887,
    "vietnameseDate": "2-7-1",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Đồng Khánh",
    "contributor": "",
    "description": "This edict promotes a deity in the Sơn Tây province. It was issued on the 1st day of the 7th month of the 2nd year of the reign of Đồng Khánh Đế (同慶帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.\n\nNote (verso):  Texts on the back reads:  Vua Thanh Thái  năm thủ hai",
    "physical": "The edict is on yellow paper and features a dragon and pearl in silver ink; it includes the the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_a42c17df1fae0814de32699526fb916a",
    "transcript": "敕本境城隍靈扶之神，向來護國庇民，稔著靈應，節蒙頒給贈敕畱祀，肆今丕膺耿命，緬念神庥，可加贈翊保中興之神，仍準許美德道美良縣順良社順良村依舊奉事，神其相佑，保我黎民，欽哉。同慶貳年柒月初壹日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      58
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:59/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:58/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/59"
  },
  {
    "dmrecord": 11,
    "title": "Edict from the Thành Thái (成泰) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Thành Thái",
    "date": "1889",
    "year": 1889,
    "vietnameseDate": "1-2-16",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Thành Thái, King of Vietnam, 1879-1954",
    "contributor": "",
    "description": "This edict promotes a military official; it was issued on the 16th day of the 2nd month of the 1st year of the reign of Thành Thái Đế (成泰帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is printed on yellow paper and features a dragon and cloud in silver ink. It includes the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_c977128a04ce4b015a2c570052dfff9b",
    "transcript": "承天興運，皇帝制曰，朕惟紹平基而撫治，先弘纘武之功；錄舊績以授官，式重典兵之寄。穀辰亶協，芝綍孔敭。咨爾禁兵副衛尉領守護使尊室廡，弧矢壯懷，鞱鈐偉負，劍馬綽優武藝，追隨分帥府之勞；軒麾參决戎籌，訓練朂師徒之勇。始終一節，先後咸勤，洵堪禦眾之才，宜正賞功之典。兹特準爾陞授剛勇將軍承天興運，皇帝制曰，朕惟紹平基而撫治，先弘纘武之功；錄舊績以授官，式重典兵之寄。穀辰亶協，芝綍孔敭。咨爾禁兵副衛尉領守護使尊室廡，弧矢壯懷，鞱鈐偉負，劍馬綽優武藝，追隨分帥府之勞；軒麾參决戎籌，訓練朂師徒之勇。始終一節，先後咸勤，洵堪禦眾之才，宜正賞功之典。兹特準爾陞授剛勇將軍守護使，錫之誥命。尚其一乃心力奮揚，靡憚於勤勞；為王爪牙衛翼，思酬於委寄，以永終譽，其克有勲，欽哉。成泰元年貳月拾陸日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      10
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:11/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:10/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/11"
  },
  {
    "dmrecord": 29,
    "title": "Edict from the Thành Thái (成泰) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Thành Thái",
    "date": "1889",
    "year": 1889,
    "vietnameseDate": "1-11-18",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Thành Thái, King of Vietnam, 1879-1954",
    "contributor": "",
    "description": "This edict promotes a deity local to Thọ Xương (Hanoi). It was issued was issued on the 18th day of the 11th month of the 1st year of the reign of Thành Thái Đế (成泰帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is printed on yellow paper and features a dragon and pearl in silver ink; it includes the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_85207714cbdbbc3b4f683d77bfb1ce0b",
    "transcript": "敕河內省壽昌縣東美村蒼門上甲奉事太尉夔國公之神，護國庇民，稔著靈應，向來未有預封，肆今丕承耿命，緬念神庥，著封為端肅翊保中興之神，準依舊奉事，神其相佑，保我黎民，欽哉。成泰元年拾壹月拾捌日\nSeal：敕命之寶",
    "transcriptNotes": "Note (verso): \nTexts on the back reads: 東美  承泰元年  九.",
    "imagePointers": [
      28
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:29/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:28/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/29"
  },
  {
    "dmrecord": 64,
    "title": "Edict from the Thành Thái (成泰) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Thành Thái",
    "date": "1890",
    "year": 1890,
    "vietnameseDate": "2-2-20",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Thành Thái, King of Vietnam, 1879-1954",
    "contributor": "",
    "description": "This edict promotes a deity local to the Nam Định province from mid-ranked to high-ranked. It was issued on the 20th day of the 2nd month of the 2nd year of the reign of Thành Thái Đế (成泰帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is printed on yellow paper and features a dragon and a cloud in silver ink; it includes the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_b1b9cd00210ef8959a02f5560fa6705d",
    "transcript": "敕勾芒尊神，原封調和滋潤熙明孚順靈邃翊保中[興]中等神，護國庇民，稔著靈應，經嗣德年間禮臣議上，肆今丕承先志，緬念神庥，著加封為粹穆上等神，準南定省務本縣延長社貳村依舊奉事，神其相佑，保我黎民，欽哉。成泰貳年貳月貳拾日\nSeal：敕命之寶",
    "transcriptNotes": "The character [興] is partially missing in the edict and has been supplied based on parallel examples in other edicts.\nNote (verso): \nTexts on the back reads: \nVua Thanh Thái \nnăm thủ hai",
    "imagePointers": [
      63
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:64/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:63/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/64"
  },
  {
    "dmrecord": 45,
    "title": "Financial document from the Thành Thái (成泰) era of the Nguyễn dynasty",
    "documentType": "Financial document",
    "dynasty": "Nguyễn",
    "era": "Thành Thái",
    "date": "1893",
    "year": 1893,
    "vietnameseDate": "5-11-25",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "",
    "contributor": "",
    "description": "This document regards the distribution of stipends and was issued by ministry of revenue. It was issued on the 25th day of the 11th month of the 5th year of the reign of Thành Thái Đế (成泰帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This document is handwritten in cursive on plain white paper. The red seal of the ministry of revenue, Hộ Bộ chi ấn (戶部之印), appears throughout.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_905e26c217cdcfd2264924d0ef9c96f1",
    "transcript": "户部為给憑事。茲據部屬賞祿司員役等禀敍，該司書吏懸缺。茲募得士人武光靛承天府富榮縣玉英總玉英社，向来素從学業，筆算稍知，未入何衙衛隊，並無干連案件，兵分亦無掛欠，具有該社里長結認確寔稟納等語。本部經察寔業聽加入班餉公務，除另咨吏、兵二部竝承天府知納外，輙此凭给，從司内佐领八九品人等奉行公務，若曠怠有咎。須至給憑者    右給憑    部屬賞祿司位入流書吏武光靛據此。成泰五年拾壹月貳拾五日\nSeal: 户部之印\nSmall red seals: 户部",
    "transcriptNotes": "The small characters in the original text, “承天府富榮縣玉英總玉英社,” are represented in a reduced font size.\nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      44
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:45/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:44/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/45"
  },
  {
    "dmrecord": 3,
    "title": "Edict from the Thành Thái (成泰) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Thành Thái",
    "date": "1898",
    "year": 1898,
    "vietnameseDate": "10-11-29",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Thành Thái, King of Vietnam, 1879-1954",
    "contributor": "",
    "description": "This edict promotes a military official to the high rank of tướng quân. It was issued on the 29th day of the 11th month of the 10th year of the reign of Thành Thái Đế (成泰帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is printed on yellow paper and features a dragon and a cloud in silver ink; it includes the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_21408788d53689d246a55477d2b2ea2f",
    "transcript": "承天興運，皇帝制曰，朕惟翼嚴共服，武為王之爪牙，旌庸用章，君視臣如手足。穀辰亶協，芝綍孔敭。咨爾護陵衛守護使司正使尊室廡，鎗劔擅長，干將偉負，披堅執銳，歷揚甲冑之班；禦侮折衝，蘊蓄韜鈐之學。夙夜匪懈，先後咸勤。肆今丕紹平基，寧忘奮武，惟爾夙嫻師律，是用敷□，兹準陞授雄威將軍，掌衛銜，回貫休致，錫之誥命，欽哉。成泰拾年拾壹月貳拾玖日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      2
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:3/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/3"
  },
  {
    "dmrecord": 1,
    "title": "Edict from the Khải Định (啟定) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Khải Định",
    "date": "1924",
    "year": 1924,
    "vietnameseDate": "9-7-25",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Khải Định, King of Vietnam, 1882-1925",
    "contributor": "",
    "description": "This edict promotes deity local to the Hoà Bình province from mid-ranked to high-ranked; it was issued on the 25th day of the 7th month of the 9th year of the reign Khải Định Đế (啓定帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is printed on yellow paper and features a dragon and cloud in silver ink; included is the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_e557b3ff85517344292a9657c4b07c67",
    "transcript": "敕和平省良山州順良社從前奉事廣渊尊神，原贈汪潤翊保中興中等神，護國庇民，稔著靈應，節蒙頒給敕封，準許奉事，肆今正值朕四旬大慶，節經頒寶詔覃㤙禮隆登秩，著加贈浤洽上等神，特準奉事，用誌國慶而申祀典，欽哉。啓定玖年柒月貳拾五日\nSeal: [敕命之寶]",
    "transcriptNotes": "The seal impression is unclear. The content was indentified through comparison and marked in brackets.",
    "imagePointers": [
      0
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:1/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:0/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/1"
  },
  {
    "dmrecord": 5,
    "title": "Promotion document from the Bảo Đại (保大) era of the Nguyễn dynasty",
    "documentType": "Promotion document",
    "dynasty": "Nguyễn",
    "era": "Bảo Đại",
    "date": "1928",
    "year": 1928,
    "vietnameseDate": "3-7-30",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Bảo Đại, King of Vietnam, 1913-1997",
    "contributor": "",
    "description": "This document promotes a civil official; it was issued on the 30th day of the 7th month of the 3rd year of the reign of Bảo Đại Đế (保大帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "This document is on plain white paper and includes the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_4751885e4b77cc24103a051755f42789",
    "transcript": "敕從八品學政□五項助教鄧如琦，兹吏部臣聲請，[準]爾陞授正八品文階，欽哉。保大叄年柒月叄拾日\nSeal：敕命之寶",
    "transcriptNotes": "[character] indicates a character is partially missing but can be identified.",
    "imagePointers": [
      4
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:5/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:4/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/5"
  },
  {
    "dmrecord": 62,
    "title": "Promotion document from the Bảo Đại (保大) era of the Nguyễn dynasty",
    "documentType": "Promotion document",
    "dynasty": "Nguyễn",
    "era": "Bảo Đại",
    "date": "1930",
    "year": 1930,
    "vietnameseDate": "5-3-3",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "",
    "contributor": "",
    "description": "This document from the ministry of personnel regards promotion of personnel. It includes the blue seal and signaature of the French colonial Résident Supérieur, an indication that the document only has value because it was approved by this individual, not the emperor. The document demonstrates the difference in the symbolic power held by the emperor while the country was under colonial rule. It was issued on the 3rd day of the 3rd month of the 5th year of the reign of Bảo Đại Đế (保大帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The document is on plain white paper and features both the red seals of the ministry of personnel, Lại Bộ chi ấn (吏部之印), but also the blue seal and signature of the French colonial Résident Supérieur which is dated 1930 April 2.",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/NoC-US/1.0/",
    "identifier": "pstsc_10178_0d6ba6c6a3c4038525ffabd69c08922e",
    "transcript": "吏部  為錄給事。本月日西一千九百三十年四月初一日，機密院商定平順省巡撫膺厖貴職陞授平富總督等因，輒此錄給。祗奉須至錄給者  右錄給  平富總督膺貴職執炤。保大五年叁月初叄日\nSeal: 吏部之印\nSmall red seals: 吏部 \nWith blue stamp and signature of the French colonial Résident Supérieur ：\nEnregistré à la \nRésidence Supérieure\nSous le N° 339\nHué, le 2 août 1930\n[ L’Administrateur ] délégué\naux [ fonctions de l’Intérieur ] de la\n□ [et de l’Instruction] publique »\nStamp: « Délégation Intérieur »",
    "transcriptNotes": "The small characters in the original text, “西一千九百三十年四月初一日,” are represented in a reduced font size.\n□ marks characters that cannot be identified.\n[character] indicates a character that is missing or partially missing but can be identified. \nDouble spaces are used to reflect the format of the document.",
    "imagePointers": [
      60,
      61
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:62/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:60/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/62"
  },
  {
    "dmrecord": 15,
    "title": "Edict from the Bảo Đại (保大) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Bảo Đại",
    "date": "1935",
    "year": 1935,
    "vietnameseDate": "10-4-19",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Bảo Đại, King of Vietnam, 1913-1997",
    "contributor": "",
    "description": "This document promotes a deity from the Sa Đéc province (Southern Vietnam); was issued on the 19th day of the 4th month of the 10th year of the reign of Bảo Đại Đế (保大帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is on yellow paper and features a dragon and cloud in silver ink; it includes the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/InC/1.0/",
    "identifier": "pstsc_10178_288b0f40073dbabfde5dd4109514f50a",
    "transcript": "敕沙□省美茶社奉事開市立邑鉤冷杜公祥尊神，稔著靈應，肆今丕承耿命念神，著封為翊保中興靈扶之神，準其奉事，庶幾神其相佑，保我黎民，欽哉。保大拾年肆月拾玖日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      14
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:15/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:14/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/15"
  },
  {
    "dmrecord": 31,
    "title": "Document from the Bảo Đại (保大) era of the Nguyễn dynasty",
    "documentType": "Document",
    "dynasty": "Nguyễn",
    "era": "Bảo Đại",
    "date": "1942",
    "year": 1942,
    "vietnameseDate": "17-9-21",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Bảo Đại, King of Vietnam, 1913-1997",
    "contributor": "",
    "description": "This document relates to the imperial academy; it was issued on the 11st day of the 9th month of the 17th year of the reign of Bảo Đại Đế (保大帝).",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The document is printed on plain white paper and featues the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/InC/1.0/",
    "identifier": "pstsc_10178_bbdb7aab0fc24f51026d8e10d3ce895f",
    "transcript": "敕高等小學文憑寳厔弘化王房，乃協佐大學士膺厖之子。兹禮儀部臣聲請，準爾蔭授翰林院修撰，欽哉。保大拾柒年玖月貳拾壹日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      30
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:31/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:30/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/31"
  },
  {
    "dmrecord": 33,
    "title": "Edict from the Bảo Đại (保大) era of the Nguyễn dynasty",
    "documentType": "Edict",
    "dynasty": "Nguyễn",
    "era": "Bảo Đại",
    "date": "1944",
    "year": 1944,
    "vietnameseDate": "19-2-23",
    "dateNotes": "The non-Gregorian dates on these materials refer to the manner in which days were counted from the beginning of the emperor’s rule. For example, an item from CE 1638 also bears the date 4-5-25, which means the document was written on the 25th day of the 5th month of the 4th year of Lê Thần Tông, the emperor who ruled during the Dương Hòa era.",
    "creator": "Bảo Đại, King of Vietnam, 1913-1997",
    "contributor": "",
    "description": "This edict posthumously bestows titles on a military official. It was issued on the 23rd day of the 2nd month of the 19th year of the reign of Bảo Đại Đế (保大帝), one year before the end of the Nguyễn dynasty.",
    "notes": "The physical collection is comprised of 32 edicts and documents. This digital collection consists of dealer images of the front of each scroll. For further questions regarding the physical collection, please contact the Eberly Family Special Collections Library at spcollections@psu.edu.",
    "physical": "The edict is printed on yellow paper and features a dragon and cloud in silver ink; it includes the red imperial seal, Sắc mệnh chi bảo (敕命之寶).",
    "subjects": [
      "Vietnam--History--Nguyẽ̂n dynasty, 1802-1945",
      "Nguyễn Dynasty (Vietnam)"
    ],
    "place": "Vietnam",
    "language": "Vietnamese, Script Han (Traditional variant)",
    "repository": "Pennsylvania State University. Special Collections Library",
    "container": "Box 02",
    "rights": "http://rightsstatements.org/vocab/InC/1.0/",
    "identifier": "pstsc_10178_bf04d7cfbb650d52584d99ba5fa22238",
    "transcript": "承天興運，皇帝制曰，朕惟人臣事上之忠，終始弗渝素節，熙代賞功之制，徃存均沛鴻恩。亶協穀辰，載頒芝綍。咨爾原龍船衛正管故黄玉營，提戈壯志，鳴劍雄風，追隨分帥府之勞，名乆知於麾下；歩伐肃兵家之律，吉允協於師中。故里歸來，松菊起秋風之興，哲人云徃，薕葭留白露之思，壯士堪嗟，未遂生平之志，彜章載考，宜加死後之恩。兹特準追授奮勇將軍副領兵，秩從三品，錫之誥命。於戲花衮增光一字之榮褒，有耀松楸生色百年之靈爽。式憑冥漠有知，祗承無斁，欽哉。保大拾玖年貳月貳拾叄日\nSeal：敕命之寶",
    "transcriptNotes": "",
    "imagePointers": [
      32
    ],
    "manifestUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:33/manifest.json",
    "thumbnailUrl": "https://digital.libraries.psu.edu/iiif/2/vietscrolls:32/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digital.libraries.psu.edu/digital/collection/vietscrolls/id/33"
  }
];
