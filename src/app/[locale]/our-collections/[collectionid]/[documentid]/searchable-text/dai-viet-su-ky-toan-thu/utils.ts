// Flatten items to assign unique topic indexes
export const flattenItems = (
  data: any[]
): { title: string; index: number }[] => {
  const result: { title: string; index: number }[] = [];
  let currentIndex = 0;

  function traverse(items: any[]) {
    for (const item of items) {
      if (item.children) {
        traverse(item.children);
      } else {
        result.push({ title: item.title, index: currentIndex++ });
      }
    }
  }

  traverse(data);
  return result;
};

export const titles = [
  {
    title: "Quyển Thủ",
    children: [
      { title: "Tục biên tự" },
      { title: "Tục biên thư" },
      { title: "Ngoại kỷ toàn thư" },
      { title: "Toàn thư biểu" },
      { title: "Toàn thư phàm lệ" },
      { title: "Kỷ niên mục lục" },
      { title: "Khảo tổng luận" },
    ],
  },
  {
    title: "Ngoại kỷ toàn thư",
    children: [
      { title: "Kỷ Hồng Bàng thị" },
      { title: "Kỷ Nhà Thục" },
      { title: "Kỷ Nhà Triệu" },
      { title: "Kỷ Thuộc Tây Hán" },
      { title: "Kỷ Trưng Nữ Vương" },
      { title: "Kỷ Thuộc Đông Hán" },
      { title: "Kỷ Sĩ Vương" },
      { title: "Kỷ Thuộc Ngô, Tấn, Tống, Tề, Lương" },
      { title: "Kỷ Tiền Lý" },
      { title: "Kỷ Triệu Việt Vương" },
      { title: "Kỷ Hậu Lý" },
      { title: "Kỷ Thuộc Tuỳ, Đường" },
      { title: "Kỷ Nam Bắc phân tranh" },
      { title: "Kỷ Nhà Ngô" },
    ],
  },
  {
    title: "Bản kỷ toàn thư",
    children: [
      { title: "Kỷ nhà Đinh" },
      { title: "Kỷ nhà Lê" },
      {
        title: "Kỷ nhà Lý",
        children: [
          { title: "Thái Tổ Hoàng Đế" },
          { title: "Thái Tông Hoàng Đế" },
          { title: "Thánh Tông Hoàng Đế" },
          { title: "Nhân Tông Hoàng Đế" },
          { title: "Thần Tông Hoàng Đế" },
          { title: "Anh Tông Hoàng Đế" },
          { title: "Cao Tông Hoàng Đế" },
          { title: "Huệ Tông Hoàng Đế" },
          { title: "Chiêu Hoàng" },
        ],
      },
      {
        title: "Kỷ nhà Trần",
        children: [
          { title: "Thái Tông Hoàng Đế " },
          { title: "Thánh Tông Hoàng Đế " },
          { title: "Nhân Tông Hoàng Đế " },
          { title: "Anh Tông Hoàng Đế " },
          { title: "Minh Tông Hoàng Đế" },
          { title: "Hiến Tông Hoàng Đế" },
          { title: "Dụ Tông Hoàng Đế" },
          { title: "Nghệ Tông Hoàng Đế" },
          { title: "Duệ Tông Hoàng Đế" },
          { title: "Phế Đế" },
          { title: "Thuận Tông Hoàng Đế" },
          { title: "Thiếu Đế" },
          { title: "Phụ: Hồ Quý Ly, Hồ Hán Thương" },
        ],
      },
      { title: "Kỷ Hậu Trần" },
      { title: "Kỷ Thuộc Minh" },
      {
        title: "Kỷ Lê Hoàng Triều",
        children: [{ title: "Thái Tông cao Hoàng Đế" }],
      },
    ],
  },
  {
    title: "Bản kỷ thực lục",
    children: [
      { title: "Thánh Tông Văn Hoàng Đế" },
      { title: "Nhân Tông Tuyên Hoàng Đế" },
      { title: "Thánh Tông Thuần Hoàng Đế(thượng)" },
      { title: "Thánh Tông Thuần Hoàng Đế(hạ)" },
      { title: "Hiến Tông Duệ Hoàng Đế" },
      { title: "Túc Tông Khâm Hoàng Đế" },
      { title: "Uy Mục Đế" },
      { title: "Tương Dực Đế" },
      { title: "Chiêu Tông Thần Hoàng Đế" },
      { title: "Cung Hoàng Đế" },
      { title: "Phụ: Mạc Đăng Dung, Mặc Đăng Doanh" },
    ],
  },
  {
    title: "Bản kỷ tục biên",
    children: [
      { title: "Trang Tông Dụ Hoàng Đế" },
      { title: "Phụ: Mặc Đăng Doanh, Mạc Phúc Nguyên" },
      { title: "Trung Tông Vũ Hoàng Đế" },
      { title: "Phụ: Mạc Phúc Nguyên" },
      { title: "Anh Tông Tuần Hoàng Đế" },
      { title: "Phụ: Mạc Phúc Nguyên " },
      { title: "Thế Tông Nghị Hoàng Đế" },
      { title: "Phụ: Mạc Hậu Hợp" },
      { title: "Kính Tông Huệ Hoàng Đế" },
      { title: "Thần Tông Uyên Hoàng Đế (thượng)" },
      { title: "Chân Tông Thuận Hoàng Đế" },
      { title: "Thần Tông Uyên Hoàng Đế (hạ)" },
      { title: "Huyền Tông Mục Hoàng Đế" },
      { title: "Gia Tông Mỹ Hoàng Đế" },
    ],
  },
];

export function topicIdToTitle(bookId: number): string {
  switch (bookId) {
    case 1:
      return "Kỷ Hồng Bàng thị";
    case 2:
      return "Kỷ Nhà Thục";
    case 3:
      return "Kỷ Nhà Triệu";
    case 4:
      return "Kỷ Thuộc Tây Hán";
    case 5:
      return "Kỷ Trưng Nữ Vương";
    case 6:
      return "Kỷ Thuộc Đông Hán";
    case 7:
      return "Kỷ Sĩ Vương";
    case 8:
      return "Kỷ Thuộc Ngô, Tấn, Tống, Tề, Lương";
    case 9:
      return "Kỷ Tiền Lý";
    case 10:
      return "Kỷ Triệu Việt Vương";
    case 11:
      return "Kỷ Hậu Lý";
    case 12:
      return "Kỷ Thuộc Tuỳ, Đường";
    case 13:
      return "Kỷ Nam Bắc phân tranh";
    case 14:
      return "Kỷ Nhà Ngô";
    case 24:
      return "Kỷ nhà Đinh";
    case 26:
      return "Kỷ nhà Lê";
    case 29:
      return "Thái Tổ Hoàng Đế";
    case 30:
      return "Thái Tông Hoàng Đế";
    case 31:
      return "Thánh Tông Hoàng Đế";
    case 32:
      return "Nhân Tông Hoàng Đế";
    case 33:
      return "Thần Tông Hoàng Đế";
    case 34:
      return "Anh Tông Hoàng Đế";
    case 35:
      return "Cao Tông Hoàng Đế";
    case 36:
      return "Huệ Tông Hoàng Đế";
    case 37:
      return "Chiêu Hoàng";
    case 38:
      return "Thái Tông Hoàng Đế ";
    case 39:
      return "Thánh Tông Hoàng Đế ";
    case 40:
      return "Nhân Tông Hoàng Đế ";
    case 41:
      return "Anh Tông Hoàng Đế ";
    case 42:
      return "Minh Tông Hoàng Đế";
    case 43:
      return "Hiến Tông Hoàng Đế";
    case 44:
      return "Dụ Tông Hoàng Đế";
    case 46:
      return "Nghệ Tông Hoàng Đế";
    case 48:
      return "Duệ Tông Hoàng Đế";
    case 49:
      return "Phế Đế";
    case 50:
      return "Thuận Tông Hoàng Đế";
    case 51:
      return "Thiếu Đế";
    case 52:
      return "Phụ: Hồ Quý Ly, Hồ Hán Thương";
    case 54:
      return "Kỷ Hậu Trần";
    case 56:
      return "Kỷ Thuộc Minh";
    case 57:
      return "Thái Tông cao Hoàng Đế";
    case 58:
      return "Thánh Tông Văn Hoàng Đế";
    case 59:
      return "Nhân Tông Tuyên Hoàng Đế";
    case 60:
      return "Thánh Tông Thuần Hoàng Đế (thượng)";
    case 61:
      return "Thánh Tông Thuần Hoàng Đế (hạ)";
    case 62:
      return "Hiến Tông Duệ Hoàng Đế";
    case 63:
      return "Túc Tông Khâm Hoàng Đế";
    case 64:
      return "Uy Mục Đế";
    case 65:
      return "Tương Dực Đế";
    case 66:
      return "Chiêu Tông Thần Hoàng Đế";
    case 67:
      return "Cung Hoàng Đế";
    case 68:
      return "Phụ: Mạc Đăng Dung, Mặc Đăng Doanh";
    case 70:
      return "Trang Tông Dụ Hoàng Đế";
    case 71:
      return "Phụ: Mặc Đăng Doanh, Mạc Phúc Nguyên";
    case 74:
      return "Trung Tông Vũ Hoàng Đế";
    case 75:
      return "Phụ: Mạc Phúc Nguyên";
    case 76:
      return "Anh Tông Tuần Hoàng Đế";
    case 77:
      return "Phụ: Mạc Phúc Nguyên ";
    case 79:
      return "Thế Tông Nghị Hoàng Đế";
    case 80:
      return "Phụ: Mạc Hậu Hợp";
    case 81:
      return "Kính Tông Huệ Hoàng Đế";
    case 82:
      return "Thần Tông Uyên Hoàng Đế (thượng)";
    case 83:
      return "Chân Tông Thuận Hoàng Đế";
    case 84:
      return "Thần Tông Uyên Hoàng Đế (hạ)";
    case 85:
      return "Huyền Tông Mục Hoàng Đế";
    case 86:
      return "Gia Tông Mỹ Hoàng Đế";
    case 100:
      return "Tục biên tự";
    case 101:
      return "Tục biên thư";
    case 102:
      return "Ngoại kỷ toàn thư tự";
    case 103:
      return "Toàn thư biểu";
    case 104:
      return "Toàn thư phàm lệ";
    case 105:
      return "Kỷ niên mục lục";
    case 106:
      return "Khảo tổng luận";
    case 110:
      return "Quyển XX";
    case 111:
      return "Quyển XXI";
  }
  return "";
}

export function titleToTopicId(title: string): number {
  switch (title) {
    case "Kỷ Hồng Bàng thị":
      return 1;
    case "Kỷ Nhà Thục":
      return 2;
    case "Kỷ Nhà Triệu":
      return 3;
    case "Kỷ Thuộc Tây Hán":
      return 4;
    case "Kỷ Trưng Nữ Vương":
      return 5;
    case "Kỷ Thuộc Đông Hán":
      return 6;
    case "Kỷ Sĩ Vương":
      return 7;
    case "Kỷ Thuộc Ngô, Tấn, Tống, Tề, Lương":
      return 8;
    case "Kỷ Tiền Lý":
      return 9;
    case "Kỷ Triệu Việt Vương":
      return 10;
    case "Kỷ Hậu Lý":
      return 11;
    case "Kỷ Thuộc Tuỳ, Đường":
      return 12;
    case "Kỷ Nam Bắc phân tranh":
      return 13;
    case "Kỷ Nhà Ngô":
      return 14;
    case "Kỷ nhà Đinh":
      return 24;
    case "Kỷ nhà Lê":
      return 26;
    case "Thái Tổ Hoàng Đế":
      return 29;
    case "Thái Tông Hoàng Đế":
      return 30;
    case "Thánh Tông Hoàng Đế":
      return 31;
    case "Nhân Tông Hoàng Đế":
      return 32;
    case "Thần Tông Hoàng Đế":
      return 33;
    case "Anh Tông Hoàng Đế":
      return 34;
    case "Cao Tông Hoàng Đế":
      return 35;
    case "Huệ Tông Hoàng Đế":
      return 36;
    case "Chiêu Hoàng":
      return 37;
    case "Thái Tông Hoàng Đế ":
      return 38;
    case "Thánh Tông Hoàng Đế ":
      return 39;
    case "Nhân Tông Hoàng Đế ":
      return 32;
    case "Anh Tông Hoàng Đế ":
      return 41;
    case "Minh Tông Hoàng Đế":
      return 42;
    case "Hiến Tông Hoàng Đế":
      return 43;
    case "Dụ Tông Hoàng Đế":
      return 44;
    case "Nghệ Tông Hoàng Đế":
      return 46;
    case "Duệ Tông Hoàng Đế":
      return 48;
    case "Phế Đế":
      return 49;
    case "Thuận Tông Hoàng Đế":
      return 50;
    case "Thiếu Đế":
      return 51;
    case "Phụ: Hồ Quý Ly, Hồ Hán Thương":
      return 52;
    case "Kỷ Hậu Trần":
      return 54;
    case "Kỷ Thuộc Minh":
      return 56;
    case "Thái Tông cao Hoàng Đế":
      return 57;
    case "Thánh Tông Văn Hoàng Đế":
      return 58;
    case "Nhân Tông Tuyên Hoàng Đế":
      return 59;
    case "Thánh Tông Thuần Hoàng Đế (thượng)":
      return 60;
    case "Thánh Tông Thuần Hoàng Đế (hạ)":
      return 61;
    case "Hiến Tông Duệ Hoàng Đế":
      return 62;
    case "Túc Tông Khâm Hoàng Đế":
      return 63;
    case "Uy Mục Đế":
      return 64;
    case "Tương Dực Đế":
      return 65;
    case "Chiêu Tông Thần Hoàng Đế":
      return 66;
    case "Cung Hoàng Đế":
      return 67;
    case "Phụ: Mạc Đăng Dung, Mặc Đăng Doanh":
      return 68;
    case "Trang Tông Dụ Hoàng Đế":
      return 70;
    case "Phụ: Mặc Đăng Doanh, Mạc Phúc Nguyên":
      return 71;
    case "Trung Tông Vũ Hoàng Đế":
      return 74;
    case "Phụ: Mạc Phúc Nguyên":
      return 75;
    case "Anh Tông Tuần Hoàng Đế":
      return 76;
    case "Phụ: Mạc Phúc Nguyên ":
      return 77;
    case "Thế Tông Nghị Hoàng Đế":
      return 79;
    case "Phụ: Mạc Hậu Hợp":
      return 80;
    case "Kính Tông Huệ Hoàng Đế":
      return 81;
    case "Thần Tông Uyên Hoàng Đế (thượng)":
      return 82;
    case "Chân Tông Thuận Hoàng Đế":
      return 83;
    case "Thần Tông Uyên Hoàng Đế (hạ)":
      return 84;
    case "Huyền Tông Mục Hoàng Đế":
      return 85;
    case "Gia Tông Mỹ Hoàng Đế":
      return 86;
    case "Tục biên tự":
      return 100;
    case "Tục biên thư":
      return 101;
    case "Ngoại kỷ toàn thư tự":
      return 102;
    case "Toàn thư biểu":
      return 103;
    case "Toàn thư phàm lệ":
      return 104;
    case "Kỷ niên mục lục":
      return 105;
    case "Khảo tổng luận":
      return 106;
    case "Quyển XX":
      return 110;
    case "Quyển XXI":
      return 111;
  }
  return 0;
}

export const topicIdToImage = (topicId: number): string => {
  switch (topicId) {
    case 1:
      return "ngoai-ky/quyen1/DVSKTT_ngoai_I_";
    case 2:
      return "ngoai-ky/quyen1/DVSKTT_ngoai_I_";
    case 3:
      return "ngoai-ky/quyen2/DVSKTT_ngoai_II_";
    case 4:
      return "ngoai-ky/quyen3/DVSKTT_ngoai_III_";
    case 5:
      return "ngoai-ky/quyen3/DVSKTT_ngoai_III_";
    case 6:
      return "ngoai-ky/quyen3/DVSKTT_ngoai_III_";
    case 7:
      return "ngoai-ky/quyen3/DVSKTT_ngoai_III_";
    case 8:
      return "ngoai-ky/quyen4/DVSKTT_ngoai_IV_";
    case 9:
      return "ngoai-ky/quyen4/DVSKTT_ngoai_IV_";
    case 10:
      return "ngoai-ky/quyen4/DVSKTT_ngoai_IV_";
    case 11:
      return "ngoai-ky/quyen4/DVSKTT_ngoai_IV_";
    case 12:
      return "ngoai-ky/quyen5/DVSKTT_ngoai_V_";
    case 13:
      return "ngoai-ky/quyen5/DVSKTT_ngoai_V_";
    case 14:
      return "ngoai-ky/quyen5/DVSKTT_ngoai_V_";
    case 24:
      return "ban-ky-toan-thu/quyen1/DVSKTT_ban_toan_I_";
    case 25:
      return "ban-ky-toan-thu/quyen1/DVSKTT_ban_toan_I_";
    case 26:
      return "ban-ky-toan-thu/quyen1/DVSKTT_ban_toan_I_";
    case 27:
      return "ban-ky-toan-thu/quyen1/DVSKTT_ban_toan_I_";
    case 28:
      return "ban-ky-toan-thu/quyen1/DVSKTT_ban_toan_I_";
    case 29:
      return "ban-ky-toan-thu/quyen2/DVSKTT_ban_toan_II_";
    case 30:
      return "ban-ky-toan-thu/quyen2/DVSKTT_ban_toan_II_";
    case 31:
      return "ban-ky-toan-thu/quyen3/DVSKTT_ban_toan_III_";
    case 32:
      return "ban-ky-toan-thu/quyen3/DVSKTT_ban_toan_III_";
    case 33:
      return "ban-ky-toan-thu/quyen3/DVSKTT_ban_toan_III_";
    case 34:
      return "ban-ky-toan-thu/quyen4/DVSKTT_ban_toan_IV_";
    case 35:
      return "ban-ky-toan-thu/quyen4/DVSKTT_ban_toan_IV_";
    case 36:
      return "ban-ky-toan-thu/quyen4/DVSKTT_ban_toan_IV_";
    case 37:
      return "ban-ky-toan-thu/quyen4/DVSKTT_ban_toan_IV_";
    case 38:
      return "ban-ky-toan-thu/quyen5/DVSKTT_ban_toan_V_";
    case 39:
      return "ban-ky-toan-thu/quyen5/DVSKTT_ban_toan_V_";
    case 40:
      return "ban-ky-toan-thu/quyen5/DVSKTT_ban_toan_V_";
    case 41:
      return "ban-ky-toan-thu/quyen6/DVSKTT_ban_toan_VI_";
    case 42:
      return "ban-ky-toan-thu/quyen6/DVSKTT_ban_toan_VI_";
    case 43:
      return "ban-ky-toan-thu/quyen7/DVSKTT_ban_toan_VII_";
    case 44:
      return "ban-ky-toan-thu/quyen7/DVSKTT_ban_toan_VII_";
    case 46:
      return "ban-ky-toan-thu/quyen7/DVSKTT_ban_toan_VII_";
    case 48:
      return "ban-ky-toan-thu/quyen7/DVSKTT_ban_toan_VII_";
    case 49:
      return "ban-ky-toan-thu/quyen8/DVSKTT_ban_toan_VIII_";
    case 50:
      return "ban-ky-toan-thu/quyen8/DVSKTT_ban_toan_VIII_";
    case 51:
      return "ban-ky-toan-thu/quyen8/DVSKTT_ban_toan_VIII_";
    case 52:
      return "ban-ky-toan-thu/quyen8/DVSKTT_ban_toan_VIII_";
    case 53:
      return "ban-ky-toan-thu/quyen8/DVSKTT_ban_toan_VIII_";
    case 54:
      return "ban-ky-toan-thu/quyen9/DVSKTT_ban_toan_IX_";
    case 55:
      return "ban-ky-toan-thu/quyen9/DVSKTT_ban_toan_IX_";
    case 56:
      return "ban-ky-toan-thu/quyen9/DVSKTT_ban_toan_IX_";
    case 57:
      return "ban-ky-toan-thu/quyen10/DVSKTT_ban_toan_X_";
    case 58:
      return "ban-ky-thuc-luc/quyen11/DVSKTT_ban_thuc_XI_";
    case 59:
      return "ban-ky-thuc-luc/quyen11/DVSKTT_ban_thuc_XI_";
    case 60:
      return "ban-ky-thuc-luc/quyen12/DVSKTT_ban_thuc_XII_";
    case 61:
      return "ban-ky-thuc-luc/quyen13/DVSKTT_ban_thuc_XIII_";
    case 62:
      return "ban-ky-thuc-luc/quyen14/DVSKTT_ban_thuc_XIV_";
    case 63:
      return "ban-ky-thuc-luc/quyen14/DVSKTT_ban_thuc_XIV_";
    case 64:
      return "ban-ky-thuc-luc/quyen14/DVSKTT_ban_thuc_XIV_";
    case 65:
      return "ban-ky-thuc-luc/quyen15/DVSKTT_ban_thuc_XV_";
    case 66:
      return "ban-ky-thuc-luc/quyen15/DVSKTT_ban_thuc_XV_";
    case 67:
      return "ban-ky-thuc-luc/quyen15/DVSKTT_ban_thuc_XV_";
    case 68:
      return "ban-ky-thuc-luc/quyen15/DVSKTT_ban_thuc_XV_";
    case 69:
      return "ban-ky-thuc-luc/quyen15/DVSKTT_ban_thuc_XV_";
    case 70:
      return "ban-ky-tuc-bien/quyen16/DVSKTT_ban_tuc_XVI_";
    case 71:
      return "ban-ky-tuc-bien/quyen16/DVSKTT_ban_tuc_XVI_";
    case 74:
      return "ban-ky-tuc-bien/quyen16/DVSKTT_ban_tuc_XVI_";
    case 75:
      return "ban-ky-tuc-bien/quyen16/DVSKTT_ban_tuc_XVI_";
    case 76:
      return "ban-ky-tuc-bien/quyen16/DVSKTT_ban_tuc_XVI_";
    case 77:
      return "ban-ky-tuc-bien/quyen16/DVSKTT_ban_tuc_XVI_";
    case 79:
      return "ban-ky-tuc-bien/quyen17/DVSKTT_ban_tuc_XVII_";
    case 80:
      return "ban-ky-tuc-bien/quyen17/DVSKTT_ban_tuc_XVII_";
    case 81:
      return "ban-ky-tuc-bien/quyen18/DVSKTT_ban_tuc_XVIII_";
    case 82:
      return "ban-ky-tuc-bien/quyen18/DVSKTT_ban_tuc_XVIII_";
    case 83:
      return "ban-ky-tuc-bien/quyen18/DVSKTT_ban_tuc_XVIII_";
    case 84:
      return "ban-ky-tuc-bien/quyen18/DVSKTT_ban_tuc_XVIII_";
    case 85:
      return "ban-ky-tuc-bien/quyen19/DVSKTT_ban_tuc_XIX_";
    case 86:
      return "ban-ky-tuc-bien/quyen19/DVSKTT_ban_tuc_XIX_";
    case 100:
      return "quyen-thu/quyen1/DVSKTT_thu_I_";
    case 101:
      return "quyen-thu/quyen2/DVSKTT_thu_II_";
    case 102:
      return "quyen-thu/quyen3/DVSKTT_thu_III_";
    case 103:
      return "quyen-thu/quyen4/DVSKTT_thu_IV_";
    case 104:
      return "quyen-thu/quyen5/DVSKTT_thu_V_";
    case 105:
      return "quyen-thu/quyen6/DVSKTT_thu_VI_";
    case 106:
      return "quyen-thu/quyen7/DVSKTT_thu_VII_";
    case 110:
      return "phu-luc/quyen20/";
    case 111:
      return "phu-luc/quyen21/";
    default:
      return "";
  }
};
