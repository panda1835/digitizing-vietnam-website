export interface ReignPeriod {
  name: string;
  han: string;
  ruler: string;
  startYear: number;
  endYear: number;
}

export interface Dynasty {
  id: string;
  name: string;
  han: string;
  en: string;
  startYear: number;
  endYear: number;
  reigns: ReignPeriod[];
}

export const HEAVENLY_STEMS = [
  { vi: "Giáp", han: "甲" },
  { vi: "Ất", han: "乙" },
  { vi: "Bính", han: "丙" },
  { vi: "Đinh", han: "丁" },
  { vi: "Mậu", han: "戊" },
  { vi: "Kỷ", han: "己" },
  { vi: "Canh", han: "庚" },
  { vi: "Tân", han: "辛" },
  { vi: "Nhâm", han: "壬" },
  { vi: "Quý", han: "癸" },
];

export const EARTHLY_BRANCHES = [
  { vi: "Tý", han: "子", en: "Rat" },
  { vi: "Sửu", han: "丑", en: "Ox" },
  { vi: "Dần", han: "寅", en: "Tiger" },
  { vi: "Mão", han: "卯", en: "Rabbit/Cat" },
  { vi: "Thìn", han: "辰", en: "Dragon" },
  { vi: "Tỵ", han: "巳", en: "Snake" },
  { vi: "Ngọ", han: "午", en: "Horse" },
  { vi: "Mùi", han: "未", en: "Goat" },
  { vi: "Thân", han: "申", en: "Monkey" },
  { vi: "Dậu", han: "酉", en: "Rooster" },
  { vi: "Tuất", han: "戌", en: "Dog" },
  { vi: "Hợi", han: "亥", en: "Pig" },
];

/** Returns the heavenly stem and earthly branch for a given Gregorian year. */
export function getSexagenary(year: number): {
  stem: (typeof HEAVENLY_STEMS)[0];
  branch: (typeof EARTHLY_BRANCHES)[0];
} {
  const stemIndex = ((year - 4) % 10 + 10) % 10;
  const branchIndex = ((year - 4) % 12 + 12) % 12;
  return { stem: HEAVENLY_STEMS[stemIndex], branch: EARTHLY_BRANCHES[branchIndex] };
}

/** Only even+even or odd+odd stem/branch pairings are valid in the sexagenary cycle. */
export function isValidSexagenary(stemIndex: number, branchIndex: number): boolean {
  return stemIndex % 2 === branchIndex % 2;
}

/** Returns all Gregorian years in [fromYear, toYear] matching the given stem+branch. */
export function getYearsForSexagenary(
  stemIndex: number,
  branchIndex: number,
  fromYear: number,
  toYear: number
): number[] {
  if (!isValidSexagenary(stemIndex, branchIndex)) return [];
  const years: number[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    if (((y - 4) % 10 + 10) % 10 === stemIndex && ((y - 4) % 12 + 12) % 12 === branchIndex) {
      years.push(y);
    }
  }
  return years;
}

export const DYNASTIES: Dynasty[] = [
  {
    id: "dinh",
    name: "Nhà Đinh",
    han: "丁朝",
    en: "Đinh Dynasty",
    startYear: 968,
    endYear: 980,
    reigns: [
      { name: "Thái Bình", han: "太平", ruler: "Đinh Tiên Hoàng", startYear: 970, endYear: 979 },
    ],
  },
  {
    id: "tien-le",
    name: "Nhà Tiền Lê",
    han: "前黎朝",
    en: "Early Lê Dynasty",
    startYear: 980,
    endYear: 1009,
    reigns: [
      { name: "Thiên Phúc", han: "天福", ruler: "Lê Đại Hành", startYear: 980, endYear: 988 },
      { name: "Hưng Thống", han: "興統", ruler: "Lê Đại Hành", startYear: 989, endYear: 993 },
      { name: "Ứng Thiên", han: "應天", ruler: "Lê Đại Hành / Lê Trung Tông", startYear: 994, endYear: 1007 },
      { name: "Cảnh Thụy", han: "景瑞", ruler: "Lê Long Đĩnh", startYear: 1008, endYear: 1009 },
    ],
  },
  {
    id: "ly",
    name: "Nhà Lý",
    han: "李朝",
    en: "Lý Dynasty",
    startYear: 1009,
    endYear: 1225,
    reigns: [
      { name: "Thuận Thiên", han: "順天", ruler: "Lý Thái Tổ", startYear: 1010, endYear: 1028 },
      { name: "Thiên Thành", han: "天成", ruler: "Lý Thái Tông", startYear: 1028, endYear: 1034 },
      { name: "Thông Thụy", han: "通瑞", ruler: "Lý Thái Tông", startYear: 1034, endYear: 1038 },
      { name: "Càn Phù Hữu Đạo", han: "乾符有道", ruler: "Lý Thái Tông", startYear: 1039, endYear: 1041 },
      { name: "Minh Đạo", han: "明道", ruler: "Lý Thái Tông", startYear: 1042, endYear: 1044 },
      { name: "Thiên Cảm Thánh Vũ", han: "天感聖武", ruler: "Lý Thái Tông", startYear: 1044, endYear: 1048 },
      { name: "Sùng Hưng Đại Bảo", han: "崇興大寶", ruler: "Lý Thái Tông", startYear: 1049, endYear: 1054 },
      { name: "Long Thụy Thái Bình", han: "龍瑞太平", ruler: "Lý Thánh Tông", startYear: 1054, endYear: 1058 },
      { name: "Chương Thánh Gia Khánh", han: "彰聖嘉慶", ruler: "Lý Thánh Tông", startYear: 1059, endYear: 1065 },
      { name: "Long Chương Thiên Tự", han: "龍彰天嗣", ruler: "Lý Thánh Tông", startYear: 1066, endYear: 1067 },
      { name: "Thiên Huống Bảo Tượng", han: "天貺寶象", ruler: "Lý Thánh Tông", startYear: 1068, endYear: 1069 },
      { name: "Thần Vũ", han: "神武", ruler: "Lý Thánh Tông", startYear: 1069, endYear: 1072 },
      { name: "Thái Ninh", han: "太寧", ruler: "Lý Nhân Tông", startYear: 1072, endYear: 1076 },
      { name: "Anh Vũ Chiêu Thắng", han: "英武昭勝", ruler: "Lý Nhân Tông", startYear: 1076, endYear: 1084 },
      { name: "Quảng Hựu", han: "廣祐", ruler: "Lý Nhân Tông", startYear: 1085, endYear: 1092 },
      { name: "Hội Phong", han: "會豐", ruler: "Lý Nhân Tông", startYear: 1092, endYear: 1100 },
      { name: "Long Phù", han: "龍符", ruler: "Lý Nhân Tông", startYear: 1101, endYear: 1109 },
      { name: "Hội Tường Đại Khánh", han: "會祥大慶", ruler: "Lý Nhân Tông", startYear: 1110, endYear: 1119 },
      { name: "Thiên Phù Duệ Vũ", han: "天符睿武", ruler: "Lý Nhân Tông", startYear: 1120, endYear: 1126 },
      { name: "Thiên Phù Khánh Thọ", han: "天符慶壽", ruler: "Lý Nhân Tông", startYear: 1127, endYear: 1128 },
      { name: "Thiên Thuận", han: "天順", ruler: "Lý Thần Tông", startYear: 1128, endYear: 1132 },
      { name: "Thiên Chương Bảo Tự", han: "天彰寶嗣", ruler: "Lý Thần Tông", startYear: 1133, endYear: 1137 },
      { name: "Thiệu Minh", han: "紹明", ruler: "Lý Anh Tông", startYear: 1138, endYear: 1139 },
      { name: "Đại Định", han: "大定", ruler: "Lý Anh Tông", startYear: 1140, endYear: 1162 },
      { name: "Chính Long Bảo Ứng", han: "正隆寶應", ruler: "Lý Anh Tông", startYear: 1163, endYear: 1174 },
      { name: "Thiên Cảm Chí Bảo", han: "天感至寶", ruler: "Lý Anh Tông", startYear: 1174, endYear: 1175 },
      { name: "Trinh Phù", han: "貞符", ruler: "Lý Cao Tông", startYear: 1176, endYear: 1186 },
      { name: "Thiên Tư Gia Thụy", han: "天資嘉瑞", ruler: "Lý Cao Tông", startYear: 1186, endYear: 1201 },
      { name: "Trị Bình Long Ứng", han: "治平龍應", ruler: "Lý Cao Tông", startYear: 1202, endYear: 1204 },
      { name: "Thiên Gia Bảo Hựu", han: "天嘉寶祐", ruler: "Lý Cao Tông", startYear: 1205, endYear: 1210 },
      { name: "Kiến Gia", han: "建嘉", ruler: "Lý Huệ Tông", startYear: 1211, endYear: 1224 },
      { name: "Kiến Trung", han: "建中", ruler: "Lý Chiêu Hoàng", startYear: 1225, endYear: 1225 },
    ],
  },
  {
    id: "tran",
    name: "Nhà Trần",
    han: "陳朝",
    en: "Trần Dynasty",
    startYear: 1225,
    endYear: 1400,
    reigns: [
      { name: "Kiến Trung", han: "建中", ruler: "Trần Thái Tông", startYear: 1225, endYear: 1232 },
      { name: "Thiên Ứng Chính Bình", han: "天應政平", ruler: "Trần Thái Tông", startYear: 1232, endYear: 1251 },
      { name: "Nguyên Phong", han: "元豐", ruler: "Trần Thái Tông", startYear: 1251, endYear: 1258 },
      { name: "Thiệu Long", han: "紹隆", ruler: "Trần Thánh Tông", startYear: 1258, endYear: 1272 },
      { name: "Bảo Phù", han: "寶符", ruler: "Trần Thánh Tông", startYear: 1273, endYear: 1278 },
      { name: "Thiệu Bảo", han: "紹寶", ruler: "Trần Nhân Tông", startYear: 1279, endYear: 1285 },
      { name: "Trùng Hưng", han: "重興", ruler: "Trần Nhân Tông", startYear: 1285, endYear: 1293 },
      { name: "Hưng Long", han: "興隆", ruler: "Trần Anh Tông", startYear: 1293, endYear: 1313 },
      { name: "Đại Khánh", han: "大慶", ruler: "Trần Minh Tông", startYear: 1314, endYear: 1323 },
      { name: "Khai Thái", han: "開泰", ruler: "Trần Minh Tông", startYear: 1324, endYear: 1329 },
      { name: "Khai Hựu", han: "開祐", ruler: "Trần Hiến Tông", startYear: 1330, endYear: 1341 },
      { name: "Thiệu Phong", han: "紹豐", ruler: "Trần Dụ Tông", startYear: 1341, endYear: 1357 },
      { name: "Đại Trị", han: "大治", ruler: "Trần Dụ Tông", startYear: 1358, endYear: 1369 },
      { name: "Đại Định", han: "大定", ruler: "Dương Nhật Lễ (usurper)", startYear: 1369, endYear: 1370 },
      { name: "Thiệu Khánh", han: "紹慶", ruler: "Trần Nghệ Tông", startYear: 1370, endYear: 1372 },
      { name: "Long Khánh", han: "隆慶", ruler: "Trần Duệ Tông", startYear: 1373, endYear: 1377 },
      { name: "Xương Phù", han: "昌符", ruler: "Trần Phế Đế", startYear: 1377, endYear: 1388 },
      { name: "Quang Thái", han: "光泰", ruler: "Trần Thuận Tông", startYear: 1388, endYear: 1398 },
      { name: "Kiến Tân", han: "建新", ruler: "Trần Thiếu Đế", startYear: 1398, endYear: 1400 },
    ],
  },
  {
    id: "ho",
    name: "Nhà Hồ",
    han: "胡朝",
    en: "Hồ Dynasty",
    startYear: 1400,
    endYear: 1407,
    reigns: [
      { name: "Thánh Nguyên", han: "聖元", ruler: "Hồ Quý Ly", startYear: 1400, endYear: 1400 },
      { name: "Thiệu Thành", han: "紹聖", ruler: "Hồ Hán Thương", startYear: 1401, endYear: 1407 },
    ],
  },
  {
    id: "le-so",
    name: "Nhà Lê Sơ",
    han: "黎朝",
    en: "Later Lê Dynasty (Early Period)",
    startYear: 1428,
    endYear: 1527,
    reigns: [
      { name: "Thuận Thiên", han: "順天", ruler: "Lê Thái Tổ", startYear: 1428, endYear: 1433 },
      { name: "Thiệu Bình", han: "紹平", ruler: "Lê Thái Tông", startYear: 1434, endYear: 1439 },
      { name: "Đại Bảo", han: "大寶", ruler: "Lê Thái Tông", startYear: 1440, endYear: 1442 },
      { name: "Thái Hòa", han: "太和", ruler: "Lê Nhân Tông", startYear: 1443, endYear: 1453 },
      { name: "Diên Ninh", han: "延寧", ruler: "Lê Nhân Tông", startYear: 1454, endYear: 1459 },
      { name: "Thiên Hưng", han: "天興", ruler: "Lê Nghi Dân (usurper)", startYear: 1459, endYear: 1460 },
      { name: "Quang Thuận", han: "光順", ruler: "Lê Thánh Tông", startYear: 1460, endYear: 1469 },
      { name: "Hồng Đức", han: "洪德", ruler: "Lê Thánh Tông", startYear: 1470, endYear: 1497 },
      { name: "Cảnh Thống", han: "景統", ruler: "Lê Hiến Tông", startYear: 1498, endYear: 1504 },
      { name: "Thái Trinh", han: "泰貞", ruler: "Lê Túc Tông", startYear: 1504, endYear: 1504 },
      { name: "Đoan Khánh", han: "端慶", ruler: "Lê Uy Mục", startYear: 1505, endYear: 1509 },
      { name: "Hồng Thuận", han: "洪順", ruler: "Lê Tương Dực", startYear: 1509, endYear: 1516 },
      { name: "Quang Thiệu", han: "光紹", ruler: "Lê Chiêu Tông", startYear: 1516, endYear: 1522 },
      { name: "Thống Nguyên", han: "統元", ruler: "Lê Cung Hoàng", startYear: 1522, endYear: 1527 },
    ],
  },
  {
    id: "mac",
    name: "Nhà Mạc",
    han: "莫朝",
    en: "Mạc Dynasty",
    startYear: 1527,
    endYear: 1677,
    reigns: [
      { name: "Minh Đức", han: "明德", ruler: "Mạc Đăng Dung", startYear: 1527, endYear: 1529 },
      { name: "Đại Chính", han: "大正", ruler: "Mạc Đăng Doanh", startYear: 1530, endYear: 1540 },
      { name: "Quảng Hòa", han: "廣和", ruler: "Mạc Phúc Hải", startYear: 1541, endYear: 1546 },
      { name: "Vĩnh Định", han: "永定", ruler: "Mạc Phúc Nguyên", startYear: 1547, endYear: 1547 },
      { name: "Cảnh Lịch", han: "景曆", ruler: "Mạc Phúc Nguyên", startYear: 1548, endYear: 1553 },
      { name: "Quang Bảo", han: "光寶", ruler: "Mạc Phúc Nguyên", startYear: 1554, endYear: 1561 },
      { name: "Thuần Phúc", han: "淳福", ruler: "Mạc Mậu Hợp", startYear: 1562, endYear: 1565 },
      { name: "Sùng Khang", han: "崇康", ruler: "Mạc Mậu Hợp", startYear: 1566, endYear: 1577 },
      { name: "Diên Thành", han: "延成", ruler: "Mạc Mậu Hợp", startYear: 1578, endYear: 1585 },
      { name: "Đoan Thái", han: "端泰", ruler: "Mạc Mậu Hợp", startYear: 1586, endYear: 1587 },
      { name: "Hưng Trị", han: "興治", ruler: "Mạc Mậu Hợp", startYear: 1588, endYear: 1590 },
      { name: "Hồng Ninh", han: "洪寧", ruler: "Mạc Mậu Hợp", startYear: 1591, endYear: 1592 },
      { name: "Càn Thống", han: "乾統", ruler: "Mạc Kính Cung (Cao Bằng)", startYear: 1593, endYear: 1625 },
      { name: "Long Thái", han: "隆泰", ruler: "Mạc Kính Khoan (Cao Bằng)", startYear: 1625, endYear: 1638 },
      { name: "Thuận Đức", han: "順德", ruler: "Mạc Kính Vũ (Cao Bằng)", startYear: 1638, endYear: 1677 },
    ],
  },
  {
    id: "le-trung-hung",
    name: "Nhà Lê Trung Hưng",
    han: "黎中興朝",
    en: "Later Lê Dynasty (Restoration Period)",
    startYear: 1533,
    endYear: 1789,
    reigns: [
      { name: "Nguyên Hòa", han: "元和", ruler: "Lê Trang Tông", startYear: 1533, endYear: 1548 },
      { name: "Thuận Bình", han: "順平", ruler: "Lê Trung Tông", startYear: 1549, endYear: 1556 },
      { name: "Thiên Hựu", han: "天祐", ruler: "Lê Anh Tông", startYear: 1557, endYear: 1557 },
      { name: "Chính Trị", han: "正治", ruler: "Lê Anh Tông", startYear: 1558, endYear: 1571 },
      { name: "Hồng Phúc", han: "洪福", ruler: "Lê Anh Tông", startYear: 1572, endYear: 1573 },
      { name: "Gia Thái", han: "嘉泰", ruler: "Lê Thế Tông", startYear: 1573, endYear: 1577 },
      { name: "Quang Hưng", han: "光興", ruler: "Lê Thế Tông", startYear: 1578, endYear: 1599 },
      { name: "Hoằng Định", han: "弘定", ruler: "Lê Kính Tông", startYear: 1600, endYear: 1619 },
      { name: "Vĩnh Tộ", han: "永祚", ruler: "Lê Thần Tông", startYear: 1619, endYear: 1628 },
      { name: "Đức Long", han: "德隆", ruler: "Lê Thần Tông", startYear: 1629, endYear: 1634 },
      { name: "Dương Hòa", han: "陽和", ruler: "Lê Thần Tông", startYear: 1635, endYear: 1643 },
      { name: "Phúc Thái", han: "福泰", ruler: "Lê Chân Tông", startYear: 1643, endYear: 1649 },
      { name: "Khánh Đức", han: "慶德", ruler: "Lê Thần Tông (2nd reign)", startYear: 1649, endYear: 1652 },
      { name: "Thịnh Đức", han: "盛德", ruler: "Lê Thần Tông (2nd reign)", startYear: 1653, endYear: 1657 },
      { name: "Vĩnh Thọ", han: "永壽", ruler: "Lê Thần Tông (2nd reign)", startYear: 1658, endYear: 1661 },
      { name: "Vạn Khánh", han: "萬慶", ruler: "Lê Huyền Tông", startYear: 1662, endYear: 1662 },
      { name: "Cảnh Trị", han: "景治", ruler: "Lê Huyền Tông", startYear: 1663, endYear: 1671 },
      { name: "Dương Đức", han: "陽德", ruler: "Lê Gia Tông", startYear: 1672, endYear: 1673 },
      { name: "Đức Nguyên", han: "德元", ruler: "Lê Gia Tông", startYear: 1674, endYear: 1675 },
      { name: "Vĩnh Trị", han: "永治", ruler: "Lê Hy Tông", startYear: 1676, endYear: 1680 },
      { name: "Chính Hòa", han: "正和", ruler: "Lê Hy Tông", startYear: 1680, endYear: 1705 },
      { name: "Vĩnh Thịnh", han: "永盛", ruler: "Lê Dụ Tông", startYear: 1705, endYear: 1719 },
      { name: "Bảo Thái", han: "保泰", ruler: "Lê Dụ Tông", startYear: 1720, endYear: 1729 },
      { name: "Vĩnh Khánh", han: "永慶", ruler: "Lê Duy Phường", startYear: 1729, endYear: 1732 },
      { name: "Long Đức", han: "隆德", ruler: "Lê Thuần Tông", startYear: 1732, endYear: 1735 },
      { name: "Vĩnh Hựu", han: "永祐", ruler: "Lê Ý Tông", startYear: 1735, endYear: 1740 },
      { name: "Cảnh Hưng", han: "景興", ruler: "Lê Hiển Tông", startYear: 1740, endYear: 1786 },
      { name: "Chiêu Thống", han: "昭統", ruler: "Lê Chiêu Thống", startYear: 1787, endYear: 1789 },
    ],
  },
  {
    id: "tay-son",
    name: "Nhà Tây Sơn",
    han: "西山朝",
    en: "Tây Sơn Dynasty",
    startYear: 1778,
    endYear: 1802,
    reigns: [
      { name: "Thái Đức", han: "泰德", ruler: "Nguyễn Nhạc", startYear: 1778, endYear: 1788 },
      { name: "Quang Trung", han: "光中", ruler: "Nguyễn Huệ (Emperor Quang Trung)", startYear: 1788, endYear: 1792 },
      { name: "Cảnh Thịnh", han: "景盛", ruler: "Nguyễn Quang Toản", startYear: 1793, endYear: 1801 },
      { name: "Bảo Hưng", han: "寶興", ruler: "Nguyễn Quang Toản", startYear: 1801, endYear: 1802 },
    ],
  },
  {
    id: "nguyen",
    name: "Nhà Nguyễn",
    han: "阮朝",
    en: "Nguyễn Dynasty",
    startYear: 1802,
    endYear: 1945,
    reigns: [
      { name: "Gia Long", han: "嘉隆", ruler: "Hoàng đế Gia Long (Nguyễn Ánh)", startYear: 1802, endYear: 1819 },
      { name: "Minh Mệnh", han: "明命", ruler: "Hoàng đế Minh Mạng", startYear: 1820, endYear: 1840 },
      { name: "Thiệu Trị", han: "紹治", ruler: "Hoàng đế Thiệu Trị", startYear: 1841, endYear: 1847 },
      { name: "Tự Đức", han: "嗣德", ruler: "Hoàng đế Tự Đức", startYear: 1848, endYear: 1883 },
      { name: "Dục Đức", han: "育德", ruler: "Hoàng đế Dục Đức", startYear: 1883, endYear: 1883 },
      { name: "Hiệp Hòa", han: "協和", ruler: "Hoàng đế Hiệp Hòa", startYear: 1883, endYear: 1883 },
      { name: "Kiến Phúc", han: "建福", ruler: "Hoàng đế Kiến Phúc", startYear: 1883, endYear: 1884 },
      { name: "Hàm Nghi", han: "咸宜", ruler: "Hoàng đế Hàm Nghi", startYear: 1884, endYear: 1885 },
      { name: "Đồng Khánh", han: "同慶", ruler: "Hoàng đế Đồng Khánh", startYear: 1885, endYear: 1889 },
      { name: "Thành Thái", han: "成泰", ruler: "Hoàng đế Thành Thái", startYear: 1889, endYear: 1907 },
      { name: "Duy Tân", han: "維新", ruler: "Hoàng đế Duy Tân", startYear: 1907, endYear: 1916 },
      { name: "Khải Định", han: "啓定", ruler: "Hoàng đế Khải Định", startYear: 1916, endYear: 1925 },
      { name: "Bảo Đại", han: "保大", ruler: "Hoàng đế Bảo Đại", startYear: 1926, endYear: 1945 },
    ],
  },
];

export interface ActiveReign {
  dynasty: Dynasty;
  reign: ReignPeriod;
  yearNumber: number;
}

/** Returns all reign periods active in a given Gregorian year across all dynasties. */
export function getActiveReigns(year: number): ActiveReign[] {
  const results: ActiveReign[] = [];
  for (const dynasty of DYNASTIES) {
    for (const reign of dynasty.reigns) {
      if (year >= reign.startYear && year <= reign.endYear) {
        results.push({
          dynasty,
          reign,
          yearNumber: year - reign.startYear + 1,
        });
      }
    }
  }
  return results;
}
