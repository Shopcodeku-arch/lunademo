/**
 * Dongeng Indonesia: kumpulan cerita rakyat yang diceritakan ulang dengan bahasa sendiri.
 * Cerita rakyat adalah warisan lisan bersama (domain publik); teks di bawah ini adalah penulisan ulang
 * khusus untuk Perpustakaan Luna.
 */

export type DongengCategory = 'Fabel' | 'Legenda' | 'Cerita Rakyat';
export type SceneKey =
  | 'river'
  | 'field'
  | 'forest'
  | 'sea'
  | 'mountain'
  | 'lake'
  | 'temple'
  | 'village'
  | 'pond'
  | 'night';

export interface Dongeng {
  slug: string;
  title: string;
  category: DongengCategory;
  origin: string;
  summary: string;
  scene: SceneKey;
  hue: number;
  paragraphs: string[];
  moral: string;
  keywords: string[];
}

export const DONGENG: Dongeng[] = [
  {
    slug: 'si-kancil-dan-buaya',
    title: 'Si Kancil dan Buaya',
    category: 'Fabel',
    origin: 'Nusantara',
    summary: 'Kancil yang cerdik menyeberangi sungai penuh buaya hanya dengan satu akal sederhana.',
    scene: 'river',
    hue: 172,
    keywords: ['kancil', 'buaya', 'fabel', 'sungai'],
    paragraphs: [
      'Pada suatu musim kemarau, hutan tempat Si Kancil tinggal hampir kehabisan makanan. Dari tepi sungai yang lebar, Kancil melihat sebuah kebun di seberang. Pohon mangga, jambu, dan pisang di sana penuh buah masak. Perutnya berbunyi, tetapi sungai itu dihuni banyak buaya yang selalu lapar.',
      'Kancil berpikir sejenak. Lalu ia berdiri di tepi air dan berseru, “Wahai Raja Buaya! Aku membawa kabar gembira untukmu!” Seekor buaya besar muncul ke permukaan dengan mata menyipit. “Kabar apa, Kancil? Jangan kira aku lupa bahwa kau lezat.”',
      '“Baginda Raja Hutan akan mengadakan pesta besar di seberang sana, dan seluruh buaya diundang,” kata Kancil dengan tenang. “Aku diminta menghitung berapa banyak tamu yang akan datang agar makanannya cukup untuk semua.”',
      'Raja Buaya tergiur. Ia memanggil seluruh kaumnya. Buaya-buaya itu berbaris rapat dari tepi ke tepi, kepala bertemu ekor, hingga sungai penuh punggung bersisik. “Baik, akan kuhitung satu per satu supaya tidak ada yang tertinggal,” kata Kancil.',
      'Ia melompat ke punggung buaya pertama. “Satu!” Lompat lagi. “Dua! Tiga! Empat!” Kancil terus berhitung sambil melompat, hingga lompatan terakhir mendarat tepat di tepi seberang. Ia menoleh dan tersenyum lebar. “Terima kasih, Kawan-kawan! Jumlah kalian sudah kuketahui. Sayang sekali, pesta itu tidak pernah ada. Aku hanya butuh jembatan.”',
      'Para buaya terdiam, malu karena telah terkecoh. Sementara itu, Kancil berlari ke dalam kebun dan makan buah sampai kenyang.',
    ],
    moral:
      'Akal yang tenang dapat menolong kita keluar dari bahaya. Namun gunakanlah kecerdasan dengan bijak, dan jangan lupa bahwa kejujuran tetap lebih mulia daripada tipu daya.',
  },
  {
    slug: 'si-kancil-mencuri-timun',
    title: 'Si Kancil Mencuri Timun',
    category: 'Fabel',
    origin: 'Nusantara',
    summary: 'Kancil yang tergoda timun di kebun Pak Tani belajar bahwa mengambil milik orang tidak pernah berakhir baik.',
    scene: 'field',
    hue: 138,
    keywords: ['kancil', 'timun', 'pak tani', 'fabel'],
    paragraphs: [
      'Di tepi hutan ada sebuah kebun milik Pak Tani. Timunnya besar-besar, hijau, dan segar. Setiap sore Si Kancil mengintip dari balik semak sambil menelan ludah. Padahal hutan masih menyediakan banyak makanan untuknya.',
      'Pada suatu malam, Kancil menyelinap lewat pagar yang bolong. Ia menggigit satu timun, lalu satu lagi, dan terus begitu sampai perutnya sangat kenyang. Esoknya ia datang lagi, dan lusa datang lagi. Pak Tani menjadi heran melihat timunnya selalu berkurang.',
      'Pak Tani lalu membuat orang-orangan sawah dan melumuri tubuhnya dengan getah nangka yang lengket. Ia menancapkannya di tengah kebun. Malam itu Kancil datang seperti biasa. Melihat sosok berdiri di sana, ia membentak, “Minggir! Jangan halangi jalanku!” Karena tidak dijawab, Kancil menendangnya. Kakinya langsung menempel. Ia menendang dengan kaki yang lain, menyeruduk dengan kepala, dan semuanya ikut menempel erat.',
      'Pagi harinya Pak Tani datang dan menemukan Kancil tidak bisa bergerak. “Jadi kamu pencuri timunku!” serunya. Kancil menahan napas dan berpura-pura mati. Ia diam seperti batu, matanya tertutup, dan tubuhnya lemas.',
      '“Sudah mati rupanya,” gumam Pak Tani. Ia melepaskan Kancil dari getah lalu melemparkannya ke semak di luar pagar. Begitu menyentuh tanah, Kancil melompat bangun dan lari sekencang-kencangnya.',
      'Sejak hari itu Kancil tidak pernah lagi mendekati kebun Pak Tani. Ia mencari makan di hutan dan berjanji tidak akan mengambil sesuatu yang bukan miliknya.',
    ],
    moral: 'Mengambil milik orang lain tanpa izin akan membawa masalah. Rasa cukup dan kejujuran membuat hidup lebih tenang.',
  },
  {
    slug: 'si-kancil-dan-harimau',
    title: 'Si Kancil dan Harimau',
    category: 'Fabel',
    origin: 'Nusantara',
    summary: 'Seekor harimau yang lapar hampir menerkam Kancil, tetapi Kancil punya cerita tentang “gong milik raja”.',
    scene: 'forest',
    hue: 150,
    keywords: ['kancil', 'harimau', 'fabel', 'hutan'],
    paragraphs: [
      'Suatu siang Si Kancil berjalan sambil bersenandung di dalam hutan. Tiba-tiba semak di depannya bergoyang dan seekor harimau besar melompat keluar. “Hari ini aku beruntung,” geram Harimau. “Sudah tiga hari aku belum makan, dan kau akan menjadi santapanku.”',
      'Kancil terkejut, tetapi ia tidak lari. Ia tahu berlari hanya akan membuatnya tertangkap. Dengan suara riang ia berkata, “Aduh, Harimau, kau datang di saat yang kurang tepat. Aku sedang ditugaskan Baginda Raja menjaga gong pusaka. Gong itu sangat indah, dan tidak seorang pun boleh menabuhnya.”',
      'Telinga Harimau tegak. “Gong pusaka? Seindah apa suaranya?” “Suaranya merdu sekali,” jawab Kancil. “Karena itu aku dilarang membiarkan siapa pun memukulnya.” Harimau menjadi penasaran. “Biarkan aku menabuhnya sekali saja. Setelah itu kau boleh pergi.”',
      'Kancil pura-pura ragu. “Kalau begitu, aku pergi mencari air minum dulu supaya tidak melihat kau melanggar larangan.” Ia menunjuk sebuah benda bulat besar yang tergantung di dahan pohon. Sebenarnya itu bukan gong, melainkan sarang lebah yang besar.',
      'Begitu Kancil menjauh, Harimau mengambil sebatang kayu dan memukul benda itu sekuat tenaga. Dengungan keras terdengar, dan ribuan lebah keluar dengan marah. Harimau melompat ke sungai terdekat dan menyelam untuk menghindari sengatan.',
      'Dari balik pepohonan, Kancil tertawa kecil. Ia melanjutkan perjalanan sambil bersenandung lagi, dan sejak itu Harimau selalu berpikir dua kali sebelum mempercayai omongan orang.',
    ],
    moral: 'Ketenangan di saat genting membantu kita berpikir jernih. Sebaliknya, keserakahan membuat orang mudah tertipu.',
  },
  {
    slug: 'malin-kundang',
    title: 'Malin Kundang',
    category: 'Legenda',
    origin: 'Sumatera Barat',
    summary: 'Anak yang melupakan ibunya setelah menjadi kaya, dan pelajaran yang tertinggal di Pantai Air Manis.',
    scene: 'sea',
    hue: 205,
    keywords: ['malin kundang', 'sumatera barat', 'padang', 'pantai air manis'],
    paragraphs: [
      'Di sebuah desa nelayan di pesisir Sumatera Barat, hiduplah seorang janda miskin bersama anaknya, Malin Kundang. Mereka hidup sederhana. Sang ibu bekerja keras demi sesuap nasi, dan Malin tumbuh menjadi anak yang cekatan.',
      'Ketika beranjak dewasa, Malin berkata, “Ibu, izinkan aku merantau. Aku ingin mengubah nasib kita.” Ibunya berat hati, namun akhirnya melepas anaknya dengan air mata dan doa. “Pulanglah kalau sudah berhasil, Nak. Ibu akan menunggu.”',
      'Bertahun-tahun berlalu. Malin bekerja keras, menjadi pedagang yang sukses, dan menikahi seorang perempuan dari keluarga terpandang. Ia memiliki kapal besar dengan banyak anak buah. Suatu hari kapalnya singgah di pelabuhan kampung halamannya.',
      'Kabar itu segera sampai ke telinga sang ibu. Ia berlari ke dermaga dengan pakaian lusuh dan memeluk Malin sambil menangis bahagia. “Malin, anakku! Akhirnya kau pulang!” Namun Malin malu di hadapan istri dan anak buahnya. “Perempuan tua ini bukan ibuku,” katanya dingin, lalu mendorongnya.',
      'Sang ibu terjatuh. Hatinya hancur. Dengan tangan terangkat, ia memohon kepada Tuhan agar anak yang telah melupakan asal-usulnya diberi pelajaran. Langit tiba-tiba gelap, angin bertiup kencang, dan ombak menghantam kapal Malin hingga hancur.',
      'Konon, tubuh Malin berubah menjadi batu yang masih bisa dilihat di Pantai Air Manis, Padang, bentuknya seperti orang yang bersimpuh menyesali perbuatannya.',
    ],
    moral: 'Setinggi apa pun kedudukan kita, jangan pernah melupakan orang tua dan asal-usul. Hormat dan syukur adalah harta yang paling berharga.',
  },
  {
    slug: 'bawang-merah-bawang-putih',
    title: 'Bawang Merah dan Bawang Putih',
    category: 'Cerita Rakyat',
    origin: 'Nusantara',
    summary: 'Dua saudara tiri dengan sifat yang berlawanan, dan labu yang menunjukkan siapa yang benar-benar baik.',
    scene: 'village',
    hue: 330,
    keywords: ['bawang merah', 'bawang putih', 'labu', 'cerita rakyat'],
    paragraphs: [
      'Bawang Putih tinggal bersama ibu tirinya dan saudara tirinya, Bawang Merah. Sejak ayahnya meninggal, semua pekerjaan rumah jatuh ke tangannya: menyapu, memasak, dan mencuci pakaian seluruh keluarga di sungai. Meski lelah, Bawang Putih tidak pernah mengeluh.',
      'Pada suatu hari ketika mencuci, sehelai baju milik ibu tirinya hanyut terbawa arus. Bawang Putih mengejarnya menyusuri sungai, tetapi baju itu sudah hilang. Ibu tirinya marah. “Cari baju itu sampai ketemu, atau jangan pulang!”',
      'Bawang Putih berjalan jauh sampai bertemu seorang nenek tua di tepi sungai. “Nek, apakah Nenek melihat baju yang hanyut?” “Ada, Cucuku. Aku sudah mengambilnya. Tinggallah di sini seminggu dan bantu aku, nanti bajunya kukembalikan.”',
      'Selama seminggu Bawang Putih membersihkan rumah, memasak, dan merawat nenek itu dengan sabar. Saat ia pamit, sang nenek berkata, “Kau anak yang baik. Pilihlah satu dari dua labu ini sebagai hadiah.” Bawang Putih memilih labu yang kecil. “Ini sudah lebih dari cukup, Nek.”',
      'Di rumah, labu itu dibelah dan ternyata berisi emas serta perhiasan. Ibu tirinya dan Bawang Merah terkejut, lalu iri. Bawang Merah sengaja menghanyutkan baju, menemui nenek itu, dan menyuruh nenek menyerahkan labu yang paling besar, tanpa mau membantu apa pun.',
      'Labu besar itu dibawanya pulang dengan gembira. Namun ketika dibelah, isinya adalah binatang-binatang berbisa yang membuat Bawang Merah dan ibunya lari ketakutan. Sejak itu mereka menyadari kesalahan, dan Bawang Putih hidup tenteram dengan kebaikannya.',
    ],
    moral: 'Kebaikan dan ketulusan akan berbuah manis, sedangkan iri hati dan keserakahan hanya mendatangkan kesulitan bagi diri sendiri.',
  },
  {
    slug: 'timun-mas',
    title: 'Timun Mas',
    category: 'Cerita Rakyat',
    origin: 'Jawa Tengah',
    summary: 'Gadis pemberani yang dikejar raksasa dan empat bekal ajaib dari ibunya.',
    scene: 'field',
    hue: 345,
    keywords: ['timun mas', 'buto ijo', 'raksasa', 'jawa tengah'],
    paragraphs: [
      'Mbok Rondo hidup sendirian di sebuah gubuk dan sangat ingin memiliki anak. Pada suatu hari ia bertemu Buto Ijo, raksasa hijau yang menyeramkan. Buto Ijo memberinya biji mentimun. “Tanamlah, dan kau akan mendapat anak. Tetapi ketika anak itu berumur tujuh belas tahun, serahkan kepadaku.” Karena sangat menginginkan anak, Mbok Rondo menyetujuinya.',
      'Biji itu tumbuh menjadi tanaman besar, dan di antara buahnya ada sebuah mentimun emas. Di dalamnya terdapat bayi perempuan yang cantik. Mbok Rondo menamainya Timun Mas, dan merawatnya penuh kasih sayang.',
      'Tujuh belas tahun berlalu. Timun Mas tumbuh menjadi gadis cantik, dan Buto Ijo datang menagih janji. Mbok Rondo mencari akal. “Anakku masih terlalu muda. Datanglah seminggu lagi,” katanya. Malam itu ia mendatangi seorang pertapa dan menerima empat bungkusan: biji mentimun, jarum, garam, dan terasi.',
      'Ketika Buto Ijo kembali, Timun Mas berlari ke dalam hutan. Raksasa itu mengejarnya sambil mengaum. Saat ia hampir tersusul, Timun Mas menebarkan biji mentimun. Seketika tumbuh kebun mentimun yang luas, dan Buto Ijo sibuk makan sampai kenyang.',
      'Dikejar lagi, Timun Mas menebarkan jarum yang berubah menjadi hutan bambu tajam. Buto Ijo berhasil melewatinya dengan susah payah. Lalu garam yang ditebarkan menjadi lautan luas. Buto Ijo berenang menyeberang, hampir menangkap Timun Mas.',
      'Bungkusan terakhir adalah terasi. Begitu ditebarkan, terasi berubah menjadi lautan lumpur mendidih. Buto Ijo terperosok ke dalamnya, tidak mampu keluar, dan lenyap. Timun Mas pulang dengan selamat, lalu hidup bahagia bersama ibunya.',
    ],
    moral: 'Keberanian dan akal yang tenang dapat menyelamatkan kita dari bahaya. Pikirkan baik-baik sebelum membuat janji, karena janji harus dipertanggungjawabkan.',
  },
  {
    slug: 'sangkuriang',
    title: 'Sangkuriang dan Tangkuban Parahu',
    category: 'Legenda',
    origin: 'Jawa Barat',
    summary: 'Asal-usul Gunung Tangkuban Parahu di dekat Bandung, tentang perahu yang ditendang hingga terbalik.',
    scene: 'mountain',
    hue: 262,
    keywords: ['sangkuriang', 'tangkuban parahu', 'dayang sumbi', 'bandung'],
    paragraphs: [
      'Dahulu di tanah Pasundan hiduplah seorang putri bernama Dayang Sumbi. Ia memiliki anak laki-laki yang gagah, Sangkuriang, dan seekor anjing setia bernama Tumang. Tumang sering menemani Sangkuriang berburu di hutan.',
      'Suatu hari Sangkuriang berburu tetapi tidak mendapat buruan apa pun. Karena kesal, ia melampiaskan amarahnya kepada Tumang sampai anjing itu terluka. Dayang Sumbi sangat marah dan sedih ketika mengetahuinya, sebab Tumang adalah sahabat setia keluarga mereka. Ia memukul kepala Sangkuriang dengan sendok nasi hingga meninggalkan bekas luka, lalu mengusirnya dari rumah.',
      'Sangkuriang pergi mengembara selama bertahun-tahun, sementara Dayang Sumbi diberi kemampuan awet muda. Suatu hari mereka bertemu kembali tanpa saling mengenali. Sangkuriang terpesona dan ingin menikahi Dayang Sumbi.',
      'Ketika melihat bekas luka di kepala pemuda itu, Dayang Sumbi sadar bahwa ia adalah putranya sendiri. Ia berusaha menolak, tetapi Sangkuriang terus memaksa. Maka Dayang Sumbi mengajukan syarat yang mustahil: bendungan sungai Citarum dan sebuah perahu besar harus selesai dalam satu malam.',
      'Dengan bantuan makhluk halus, Sangkuriang hampir menyelesaikan semuanya. Cemas, Dayang Sumbi menebarkan kain merah di ufuk timur sehingga langit tampak seperti fajar, dan ayam-ayam mulai berkokok.',
      'Sangkuriang yakin ia gagal. Dengan marah ia menendang perahu yang hampir jadi hingga terbalik. Perahu itu berubah menjadi gunung yang kini dikenal sebagai Tangkuban Parahu, atau “perahu yang terbalik”.',
    ],
    moral: 'Amarah dan sikap tidak mau mendengar sering membawa penyesalan. Berpikirlah sebelum bertindak, dan hargailah nasihat orang tua.',
  },
  {
    slug: 'legenda-danau-toba',
    title: 'Legenda Danau Toba',
    category: 'Legenda',
    origin: 'Sumatera Utara',
    summary: 'Seorang nelayan, seekor ikan emas, dan janji yang menciptakan danau terbesar di Indonesia.',
    scene: 'lake',
    hue: 190,
    keywords: ['danau toba', 'samosir', 'sumatera utara', 'ikan emas'],
    paragraphs: [
      'Di sebuah lembah subur di Sumatera Utara hiduplah seorang petani yang rajin bernama Toba. Selain bertani, ia juga gemar memancing. Ia hidup sendirian di gubuk kecil dan merasa kesepian.',
      'Suatu pagi Toba memancing dan mendapat seekor ikan emas yang sangat indah. Ia membawanya pulang dan menaruhnya di dalam bejana. Esok harinya, ketika pulang dari ladang, rumahnya sudah rapi dan makanan sudah tersedia. Ia penasaran, lalu mengintip. Dari dalam bejana keluar seorang gadis cantik, yang ternyata penjelmaan ikan emas itu.',
      '“Aku bersedia menjadi istrimu, asal kau berjanji tidak akan pernah menyebut bahwa aku berasal dari ikan,” kata sang gadis. Toba berjanji. Mereka menikah, lalu dikaruniai seorang anak laki-laki bernama Samosir yang sangat suka makan.',
      'Suatu siang Samosir diminta mengantar makanan untuk ayahnya di ladang. Karena lapar, ia menghabiskan sebagian besar bekal itu di tengah jalan. Toba yang kelaparan marah besar ketika tahu hal itu, dan dalam kemarahannya ia berseru, “Dasar anak ikan!”',
      'Toba segera sadar bahwa ia telah melanggar janji. Istrinya sedih dan berkata kepada Samosir, “Naiklah ke bukit itu, Nak.” Ia sendiri berdoa, lalu hujan deras turun tanpa henti. Air memenuhi lembah hingga menjadi danau yang luas.',
      'Dari tempat yang tinggi, Samosir selamat. Tanah tempatnya berdiri menjadi sebuah pulau di tengah danau itu: Pulau Samosir di Danau Toba.',
    ],
    moral: 'Jagalah ucapan dan tepatilah janji. Kata-kata yang diucapkan dalam amarah bisa menimbulkan penyesalan yang panjang.',
  },
  {
    slug: 'roro-jonggrang',
    title: 'Roro Jonggrang dan Candi Prambanan',
    category: 'Legenda',
    origin: 'Jawa Tengah / DI Yogyakarta',
    summary: 'Seribu candi dalam satu malam, dan siasat putri cantik yang menunda semuanya.',
    scene: 'temple',
    hue: 232,
    keywords: ['roro jonggrang', 'candi prambanan', 'bandung bondowoso', 'yogyakarta'],
    paragraphs: [
      'Di Kerajaan Prambanan, Raja Prabu Boko memiliki seorang putri yang sangat cantik bernama Roro Jonggrang. Kerajaan itu kemudian diserang oleh Bandung Bondowoso, seorang pangeran yang sakti dan bala tentaranya yang kuat. Prabu Boko gugur dalam pertempuran, dan Bandung Bondowoso menguasai Prambanan.',
      'Melihat kecantikan Roro Jonggrang, Bandung Bondowoso jatuh hati dan ingin menikahinya. Roro Jonggrang tidak ingin menikah dengan orang yang telah mengalahkan ayahnya. Namun ia tidak berani menolak secara terang-terangan, sehingga ia mengajukan dua syarat: dibuatkan sumur yang dalam dan seribu candi, semuanya selesai dalam satu malam.',
      'Bandung Bondowoso menyetujuinya. Dengan kesaktian dan bantuan makhluk halus, sumur itu selesai dengan cepat. Lalu ia memanggil bala bantuan, dan satu per satu candi mulai berdiri dalam waktu singkat.',
      'Roro Jonggrang gelisah ketika menyadari seribu candi hampir selesai. Ia membangunkan para dayang dan perempuan desa untuk menumbuk padi dan menyalakan api di ufuk timur. Suara lesung dan cahaya merah membuat langit tampak seperti menjelang pagi, sehingga ayam jantan berkokok.',
      'Makhluk halus mengira fajar telah tiba, lalu menghilang. Candi yang berhasil didirikan baru sembilan ratus sembilan puluh sembilan. Bandung Bondowoso marah karena merasa ditipu dan mengutuk Roro Jonggrang menjadi arca batu untuk menggenapi candi yang keseribu.',
      'Hingga kini, candi-candi yang megah itu dikenal sebagai Candi Prambanan, dan arca Roro Jonggrang masih dapat dilihat di bilik utara candi Siwa.',
    ],
    moral: 'Kejujuran lebih baik daripada akal yang menipu, dan kesombongan karena kekuatan sering berakhir dengan penyesalan.',
  },
  {
    slug: 'keong-mas',
    title: 'Keong Mas',
    category: 'Cerita Rakyat',
    origin: 'Jawa Timur',
    summary: 'Putri yang dikutuk menjadi keong emas, dan kebaikan hati seorang nenek yang menolongnya.',
    scene: 'pond',
    hue: 178,
    keywords: ['keong mas', 'candra kirana', 'inu kertapati', 'jawa timur'],
    paragraphs: [
      'Di Kerajaan Daha hiduplah dua putri, Candra Kirana dan Galuh Ajeng. Candra Kirana bertunangan dengan Raden Inu Kertapati dari Kerajaan Kahuripan. Galuh Ajeng iri dan ingin mengambil pangeran itu. Ia pergi menemui seorang penyihir untuk meminta bantuan.',
      'Penyihir itu menyihir Candra Kirana menjadi seekor keong emas, lalu menghanyutkannya ke sungai. Keong itu terbawa arus hingga tersangkut di jala seorang nenek yang sedang mencari ikan. Nenek itu, Mbok Rondo, membawanya pulang dan memeliharanya dengan sayang.',
      'Sejak itu, setiap kali Mbok Rondo pergi mencari ikan, rumahnya selalu menjadi rapi. Nasi dan lauk sudah tersedia di meja saat ia pulang. Ia heran dan ingin tahu siapa yang melakukannya. Maka suatu hari ia pura-pura pergi, tetapi bersembunyi di dalam rumah.',
      'Tak lama kemudian keong emas itu keluar dari wadahnya dan berubah menjadi seorang putri jelita yang mulai memasak. Mbok Rondo segera keluar dan memecahkan wadah keong itu agar sang putri tidak bisa kembali ke bentuk keong. “Siapa kau, Nak?” tanyanya. Candra Kirana menceritakan semua yang terjadi, dan kutukan itu pun berakhir.',
      'Sementara itu, Raden Inu Kertapati mencari tunangannya ke mana-mana. Setelah menempuh perjalanan jauh, ia tiba di rumah Mbok Rondo dan bertemu kembali dengan Candra Kirana. Keduanya menikah, dan Galuh Ajeng menyesali perbuatannya.',
    ],
    moral: 'Kebaikan hati akan membawa pertolongan di saat sulit, sedangkan iri hati hanya akan merugikan diri sendiri.',
  },
  {
    slug: 'asal-usul-rawa-pening',
    title: 'Asal-Usul Rawa Pening',
    category: 'Legenda',
    origin: 'Jawa Tengah',
    summary: 'Seorang anak yang ditolak karena penampilannya, dan tongkat yang menunjukkan siapa dirinya.',
    scene: 'lake',
    hue: 125,
    keywords: ['rawa pening', 'baru klinting', 'ambarawa', 'jawa tengah'],
    paragraphs: [
      'Di sebuah desa bernama Ngasem, penduduknya sedang bersiap merayakan pesta besar. Seorang anak yang berpenampilan buruk dan berpenyakit kulit datang ke desa itu. Namanya Baru Klinting. Ia kelaparan dan meminta sedikit makanan.',
      'Dari rumah ke rumah ia mengetuk, tetapi semua orang mengusirnya. “Pergi! Kami tidak punya makanan untuk orang sepertimu,” kata mereka. Baru Klinting terus berjalan sampai ke ujung desa dengan hati yang sedih.',
      'Di sebuah gubuk kecil, seorang janda tua bernama Nyai Latung menyambutnya dengan ramah. Ia memberinya makan, bahkan menyuruhnya duduk dan beristirahat. Baru Klinting berterima kasih. “Nek, jika nanti terdengar suara gemuruh, siapkan lesung dan naiklah ke atasnya.”',
      'Setelah itu Baru Klinting kembali ke tengah desa. Ia menancapkan sebatang lidi ke tanah dan berkata lantang, “Siapa yang dapat mencabut lidi ini?” Orang-orang menertawakan, lalu mencoba satu per satu. Tidak seorang pun mampu mencabutnya, sekuat apa pun mereka menarik.',
      'Akhirnya Baru Klinting sendiri yang mencabutnya. Dari lubang bekas lidi itu memancar air deras, makin lama makin besar, hingga seluruh desa tenggelam. Nyai Latung yang menaiki lesung selamat terapung di atas air.',
      'Desa itu kini menjadi sebuah danau luas yang disebut Rawa Pening, di dekat Ambarawa, Jawa Tengah.',
    ],
    moral: 'Jangan menilai orang dari penampilannya. Berbuat baik kepada sesama, siapa pun mereka, akan selalu menjadi pilihan yang benar.',
  },
  {
    slug: 'lutung-kasarung',
    title: 'Lutung Kasarung',
    category: 'Cerita Rakyat',
    origin: 'Jawa Barat',
    summary: 'Putri yang diasingkan ke hutan dan seekor lutung misterius yang membantunya.',
    scene: 'night',
    hue: 285,
    keywords: ['lutung kasarung', 'purbasari', 'jawa barat', 'sunda'],
    paragraphs: [
      'Di Kerajaan Pasir Batang, sang raja memiliki dua putri, Purbararang dan Purbasari. Ketika raja hendak turun takhta, ia memilih Purbasari yang bijaksana sebagai penerusnya. Keputusan itu membuat Purbararang iri.',
      'Dengan bantuan seorang penyihir, Purbararang membuat kulit adiknya dipenuhi bintik hitam. Ia berkata bahwa Purbasari terkena penyakit dan tidak pantas memimpin, lalu mengasingkannya ke hutan.',
      'Di hutan, Purbasari hidup sederhana dan sabar. Ia bertemu dengan seekor lutung, sejenis monyet, yang ternyata adalah Guruminda, seorang pangeran dari kahyangan yang dikutuk menjadi lutung. Lutung itu menjaga dan membantu Purbasari dengan setia.',
      'Atas pertolongan Guruminda, Purbasari mandi di sebuah telaga ajaib. Bintik-bintik hitam di kulitnya hilang, dan ia kembali cantik. Mendengar hal itu, Purbararang terkejut dan tidak terima. Ia menantang Purbasari mengadu keahlian.',
      'Berkali-kali Purbararang kalah dalam adu kecantikan dan kemampuan. Akhirnya ia pun mengakui kesalahannya. Guruminda kembali ke wujud pangeran dan menikah dengan Purbasari. Mereka memimpin kerajaan dengan adil dan bijaksana.',
    ],
    moral: 'Kesabaran dan ketulusan akan menemukan jalan keluarnya. Iri hati hanya membuat seseorang kehilangan kedamaian.',
  },
];

export function getDongeng(slug: string): Dongeng | undefined {
  return DONGENG.find((d) => d.slug === slug);
}

export function readMinutes(d: Dongeng): number {
  const words = d.paragraphs.join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 170));
}

/** Pilihan utama untuk sambutan & beranda perpustakaan (Si Kancil dan lainnya). */
export const FEATURED_SLUGS = [
  'si-kancil-dan-buaya',
  'malin-kundang',
  'bawang-merah-bawang-putih',
  'timun-mas',
  'sangkuriang',
  'legenda-danau-toba',
];
