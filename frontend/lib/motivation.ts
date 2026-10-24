export interface MotivationQuote {
  id: string;
  text: string;
  source: string;
  category: "islamic" | "philosophy" | "science_leaders" | "general";
  categoryLabel: string;
  reflection?: string;
}

export const MOTIVATION_QUOTES: MotivationQuote[] = [
  // --- Kategori: Mutiara Hikmah Islami ---
  {
    id: "isl_1",
    text: "Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.",
    source: "HR. Muslim no. 2699",
    category: "islamic",
    categoryLabel: "Mutiara Islami",
    reflection: "Setiap menit yang Anda luangkan untuk belajar dihitung sebagai langkah mulia menuju kebaikan abadi.",
  },
  {
    id: "isl_2",
    text: "Jika kamu tidak tahan terhadap lelahnya belajar, maka kamu harus tahan menanggung perihnya kebodohan.",
    source: "Imam Syafi'i rahimahullah",
    category: "islamic",
    categoryLabel: "Mutiara Islami",
    reflection: "Lelah dalam belajar bersifat sementara, namun buah pemahaman akan bertahan seumur hidup.",
  },
  {
    id: "isl_3",
    text: "Man jadda wajada — Siapa yang bersungguh-sungguh, maka ia akan berhasil.",
    source: "Mahfuzhat (Pepatah Arab)",
    category: "islamic",
    categoryLabel: "Mutiara Islami",
    reflection: "Hasil besar selalu berakar dari konsistensi usaha-usaha kecil yang dilakukan tanpa henti.",
  },
  {
    id: "isl_4",
    text: "Ilmu itu bukan semata-mata apa yang dihafal di kepala, melainkan apa yang mendatangkan manfaat bagi sesama.",
    source: "Imam Asy-Syafi'i",
    category: "islamic",
    categoryLabel: "Mutiara Islami",
    reflection: "Niatkan belajar hari ini agar kelak bisa memberi manfaat luas bagi keluarga dan umat.",
  },
  {
    id: "isl_5",
    text: "Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan beberapa derajat.",
    source: "QS. Al-Mujadilah: 11",
    category: "islamic",
    categoryLabel: "Mutiara Islami",
    reflection: "Ilmu adalah cahaya yang meninggikan martabat, adab, dan kebijaksanaan hidup Anda.",
  },
  {
    id: "isl_6",
    text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.",
    source: "HR. Ahmad dan Ath-Thabrani",
    category: "islamic",
    categoryLabel: "Mutiara Islami",
    reflection: "Semakin banyak ilmu yang Anda kuasai, semakin besar kapasitas Anda untuk menolong orang lain.",
  },
  {
    id: "isl_7",
    text: "Ikatlah ilmu dengan cara menuliskannya.",
    source: "Atsar Sahabat (Ali bin Abi Thalib ra)",
    category: "islamic",
    categoryLabel: "Mutiara Islami",
    reflection: "Mencatat dan mengulang adalah kunci emas mengabadikan pemahaman dalam ingatan.",
  },

  // --- Kategori: Tokoh Bangsa & Sains ---
  {
    id: "sci_1",
    text: "Hanya anak bangsa sendirilah yang dapat merubah nasib negerinya sendiri. Tak mungkin kita mengharapkan bangsa lain.",
    source: "Prof. Dr.-Ing. B.J. Habibie",
    category: "science_leaders",
    categoryLabel: "Tokoh & Sains",
    reflection: "Ketekunan Anda belajar hari ini adalah kontribusi nyata bagi masa depan generasi bangsa.",
  },
  {
    id: "sci_2",
    text: "Ing ngarsa sung tulada, ing madya mangun karsa, tut wuri handayani (Di depan memberi teladan, di tengah membangun semangat, di belakang memberi dorongan).",
    source: "Ki Hajar Dewantara",
    category: "science_leaders",
    categoryLabel: "Tokoh & Sains",
    reflection: "Belajar bukan sekadar mengejar nilai, melainkan membangun jiwa yang mampu memimpin dan menginspirasi.",
  },
  {
    id: "sci_3",
    text: "Bukan karena saya sangat cerdas, melainkan hanya karena saya memilih bertahan menghadapi masalah lebih lama.",
    source: "Albert Einstein",
    category: "science_leaders",
    categoryLabel: "Tokoh & Sains",
    reflection: "Jangan berkecil hati saat soal terasa rumit; rasa penasaran yang ulet adalah kunci penemuan besar.",
  },
  {
    id: "sci_4",
    text: "Dalam hidup ini tidak ada yang perlu ditakuti, melainkan hanya perlu dipahami. Saatnya kita lebih banyak memahami agar berkurang rasa takut kita.",
    source: "Marie Curie (Pemenang 2 Nobel)",
    category: "science_leaders",
    categoryLabel: "Tokoh & Sains",
    reflection: "Rasa cemas menghadapi ujian akan hilang ketika Anda mengubahnya menjadi pemahaman materi yang matang.",
  },

  // --- Kategori: Filosofi Hidup & Stoikisme ---
  {
    id: "phi_1",
    text: "Hambatan dalam bertindak justru memajukan tindakan. Apa yang menghalangi jalan justru menjadi jalan itu sendiri.",
    source: "Marcus Aurelius (Meditations)",
    category: "philosophy",
    categoryLabel: "Filosofis",
    reflection: "Materi yang terasa paling sulit saat ini justru akan menjadi lompatan kecerdasan terbesar Anda.",
  },
  {
    id: "phi_2",
    text: "Akar dari pendidikan memang terasa pahit, namun buah yang dihasilkannya sungguh sangat manis.",
    source: "Aristoteles",
    category: "philosophy",
    categoryLabel: "Filosofis",
    reflection: "Rasa disiplin menahan diri untuk belajar hari ini akan berbuah kesuksesan manis esok hari.",
  },
  {
    id: "phi_3",
    text: "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan Anda dapat mengubah dunia.",
    source: "Nelson Mandela",
    category: "philosophy",
    categoryLabel: "Filosofis",
    reflection: "Setiap konsep yang Anda kuasai memperluas wawasan Anda untuk membawa perubahan nyata.",
  },
];

export function getRandomMotivation(category?: string): MotivationQuote {
  let pool = MOTIVATION_QUOTES;
  if (category && category !== "all") {
    pool = MOTIVATION_QUOTES.filter((q) => q.category === category);
    if (pool.length === 0) pool = MOTIVATION_QUOTES;
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function getDailyMotivation(): MotivationQuote {
  // Deterministic daily quote based on calendar day
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length];
}
