/* =========================================================
   VocabLab — UI language catalogue
   English is the source language; Vietnamese and French are
   complete catalogues. Dynamic app strings use I18n.t(key).
   ========================================================= */
(function () {
  'use strict';

  const EN = {
    'brand.tagline': 'DELF B2 studio',
    'nav.home': 'Home',
    'nav.lessons': 'Lessons',
    'nav.practice': 'Practice',
    'nav.exam': 'Exam room',
    'nav.community': 'Community',
    'nav.progress': 'My progress',
    'nav.deck': 'Current deck',
    'nav.learner': 'Learner',
    'files.kicker': 'Your material',
    'files.title': 'Class files',
    'files.sub': 'Choose the vocabulary deck and the topics you want to practise.',
    'files.start': 'Go to practice',
    'files.wordOne': '{n} word',
    'files.wordMany': '{n} words',
    'files.topicOne': '{n} topic',
    'files.topicMany': '{n} topics',
    'files.selectedOne': '{n} topic selected · {w} words',
    'files.selectedMany': '{n} topics selected · {w} words',
    'files.noTopics': 'No topics selected',
    'files.loadedAt': 'loaded {when}',
    'files.loaded': 'loaded',
    'lessons.kicker': 'Grammar',
    'lessons.title': 'Lessons',
    'lessons.sub': 'Build the grammar you need for clear, confident B1/B2 writing.',
    'lessons.atlasTitle': 'French Tenses Atlas',
    'lessons.atlasSub': '18 chapters · A2 to B2',
    'lessons.openAtlas': 'Open the atlas',
    'lessons.continueAtlas': 'Continue the atlas',
    'lessons.handbookTitle': 'Grammaire progressive du français',
    'lessons.handbookBody': 'The book’s 52 teaching chapters, condensed into bilingual lessons: tables, examples and a quick check after every point.',
    'lessons.openHandbook': 'Open the course',
    'lessons.continueHandbook': 'Continue the course',
    'practice.kicker': 'Daily practice',
    'practice.title': 'Practice',
    'practice.topics': 'Topics',
    'practice.changeTopics': 'Change',
    'practice.pickTopics': 'pick at least one to start',
    'practice.noDeck': 'Load a class file to choose topics.',
    'practice.sub': 'Quiz, translate a paragraph, or shadow a sentence. Pick what you need today.',
    'practice.tipTitle': 'A small daily win',
    'practice.tipBody': 'Fifteen focused minutes beat an hour of scrolling. Finish one quiz and one production task, then stop while it still feels easy.',
    'practice.b2Title': 'Built for DELF B2',
    'practice.b2Body': 'After a perfect VI → target paragraph, you get optional B1/B2 vocabulary and sentence upgrades — always optional, never a rewrite of your ideas.',
    'practice.leaveConfirm': 'Leave this practice? Your current attempt will be lost.',
    'exam.title': 'Exam room',
    'exam.body': 'A focused DELF B2 exam space is next. For now, use Practice for timed paragraphs and quizzes.',
    'exam.cta': 'Go to practice',
    'community.title': 'Community',
    'community.body': 'Share progress and practise with other learners. This space is coming next.',
    'progress.kicker': 'Your journey',
    'progress.title': 'My progress',
    'progress.sub': 'A clear view of your vocabulary, grammar and streak.',
    'progress.grammar': 'Grammar course',
    'progress.streak': 'Current streak',
    'progress.best': 'Best streak: {n} days',
    'progress.accuracy': 'Accuracy',
    'progress.accuracyHint': 'Across all answered questions.',
    'home.goodMorning': 'Good morning',
    'home.goodAfternoon': 'Good afternoon',
    'home.goodEvening': 'Good evening',
    'home.streakAtRisk': 'You missed a day — finish any quest today to keep your {n}-day streak.',
    'home.streakBest': 'Best streak: {n} days',
    'home.streakStart': 'Finish any daily quest to start a streak.',
    'home.questJustCompleted': 'Streak +1 — you are on {n} days. Come back tomorrow.',
    'home.questJustCompletedOne': 'Streak +1 — you are on {n} day. Come back tomorrow.',
    'home.questLockedIn': 'Today\'s streak is locked in — {n} days. Come back tomorrow.',
    'home.questLockedInOne': 'Today\'s streak is locked in — {n} day. Come back tomorrow.',
    'exam.kicker': '{level} · Exam paper',
    'exam.questionPill': '{n} questions',
    'exam.pointPill': '{n} points',
    'exam.answeredPill': '{n} / {total} answered',
    'exam.timerTitle': 'Your 24-hour session',
    'exam.review': 'Review answers',
    'exam.startOver': 'Start over',
    'exam.resetConfirm': 'Start this exam again? Your answers and essay will be erased.',
    'exam.resetDone': 'Exam reset. A new 24-hour session has started.',
    'exam.expiredToast': 'Your 24-hour session ended. The exam restarted with empty answers.',
    'exam.piste': 'Track {n}',
    'exam.listenFree': 'Listen as often as you like — pause and replay anytime.',
    'exam.audioMissing': 'This audio file did not load: it is not in this copy of the app, or this device cannot reach the server holding it. Copy the exam/No.1 folder next to index.html, or open the app on the machine that has the audio.',
    'exam.exercise': 'Exercise {n}',
    'exam.partMeta': '{n} exercises · {p} points',
    'exam.essayMeta': '{p} points · {n}-word target',
    'exam.essayTitle': 'Writing task',
    'exam.essayLabel': 'Your article',
    'exam.essayPlaceholder': 'Write your article here (250 words)…',
    'exam.wordCount': '{n} / {target} words',
    'exam.feedback': 'AI feedback',
    'exam.feedbackBusy': 'Reading your essay…',
    'exam.feedbackEmpty': 'Write something first — the AI needs a text to read.',
    'exam.feedbackNoAi': 'AI is not set up. Open Settings → AI to use the free model or add a key.',
    'exam.feedbackError': 'The feedback could not be loaded. Try again.',
    'exam.readText': 'Read the text',
    'exam.doc': 'Document {n}',
    'exam.jump': 'Exam parts',
    'exam.footSession': 'One 24-hour session. Answers and essay save in this browser.',
    'exam.reviewTitle': 'Your answers',
    'exam.reviewSub': '{n} of {total} questions answered',
    'exam.backToPaper': 'Back to the paper',
    'exam.reviewNote': 'No official answer key is included in this paper, so compare your choices with the audio or text here. This is a self-check, not a score.',
    'exam.reviewEssay': 'Read your essay',
    'exam.essayEmpty': 'No essay written yet.',
    'exam.catalogueKicker': 'DELF B2 · Exam room',
    'exam.catalogueTitle': 'Exam papers',
    'exam.catalogueSub': 'Choose a paper, review what it contains, then start the 24-hour attempt.',
    'exam.paperCount': 'Papers available: {n}',
    'exam.open': 'View exam',
    'exam.start': 'Start exam',
    'exam.continue': 'Continue exam',
    'exam.allExams': 'All exams',
    'exam.statusActive': 'In progress · {time} left',
    'exam.statusExpired': 'Session expired',
    'exam.statusReady': 'Not started',
    'exam.audioPill': '{n} audio tracks',
    'exam.hoursPill': '{n}-hour limit',
    'exam.detailsKicker': '{level} · Exam overview',
    'exam.partsTitle': 'What the paper contains',
    'exam.startNote': 'The 24-hour clock starts when you press Start. Answers and essay save in this browser.',
    'exam.startNoteShort': 'The timer starts when you press Start.',
    'exam.noKeyNote': 'No official answer key: at the end you review your own answers.',
    'exam.methodNote': 'Essay feedback follows Stéphane Wattier’s DELF B2 writing method (content 14/25, form 11/25).',
    'exam.noPapers': 'No exam paper is installed yet.',
    'voice.automatic': 'Automatic',
    'voice.autoBest': 'Automatic — best available {lang} voice',
    'voice.deviceLabel': '{lang} voice on this device',
    'voice.deviceIntro': 'Use a {lang} voice already installed on this computer. On Linux, Firefox uses speech-dispatcher; its default eSpeak voice is robotic and can mispronounce words. Choose another voice here if you have one, or use Azure below for a natural voice.',
    'voice.azureIntro': '<strong>Azure Speech</strong> gives you a natural {lang} voice in every browser. Create a free Azure Speech resource, then paste its key and region here. The free tier includes 500K characters of voice and 5 audio hours of speech-to-text per month. Text is sent to Azure for the cloud voice; VocabLab itself never uploads or stores your audio.',
    'voice.limitNote': 'Azure scoring uses accuracy, fluency, completeness and word-level errors, and spends your 5 free speech-to-text hours. Azure does not provide a separate {lang} prosody score.',
    'voice.browser': 'Browser voice · {name}',
    'voice.none': 'No {lang} browser voice — use Azure or install one',
    'levelUp.title': 'Level up',
    'levelUp.locked': 'Make the grammar perfect to unlock B1/B2 upgrades.',
    'levelUp.empty': 'Your grammar is perfect. No safe B1/B2 upgrade found for this text.',
    'levelUp.sub': 'Optional upgrades — your ideas stay yours.',
    'levelUp.apply': 'Apply',
    'levelUp.applyAll': 'Apply all safe',
    'levelUp.verified': 'Dictionary verified',
    'levelUp.aiOnly': 'AI suggestion',
    'levelUp.unavailable': 'Dictionary check unavailable',
    'levelUp.notFound': 'Not found in dictionary — check before using',
    'levelUp.why': 'Why',
    'levelUp.meaning': 'Meaning',
    'levelUp.source': 'Dictionary',
    'levelUp.loading': 'Looking for safe B1/B2 upgrades…',
    'levelUp.waiting': 'Still working — {s}s…',
    'levelUp.error': 'Could not load upgrade suggestions.',
    'levelUp.aiNeeded': 'Add an AI key in Settings → AI to get upgrade suggestions.',
    'corrections.title': 'Corrections',
    'corrections.allGood': 'Grammar is perfect.',
    'corrections.apply': 'Apply',
    'corrections.applyAll': 'Apply all fixes',
    'corrections.corrected': 'Corrected version',
    'corrections.words': 'Required words',
    'ui.english': 'English',
    'ui.vietnamese': 'Vietnamese',
    'ui.french': 'French',
    'ui.languageChanged': 'Interface language updated.'
  };

  const VI = {
    'brand.tagline': 'Xưởng luyện DELF B2',
    'nav.home': 'Trang chủ',
    'nav.lessons': 'Bài giảng',
    'nav.practice': 'Luyện tập',
    'nav.exam': 'Phòng thi',
    'nav.community': 'Cộng đồng',
    'nav.progress': 'Tiến bộ của tôi',
    'nav.deck': 'Bộ từ hiện tại',
    'nav.learner': 'Học viên',
    'files.kicker': 'Học liệu của bạn',
    'files.title': 'Tệp của lớp',
    'files.sub': 'Chọn bộ từ vựng và các chủ đề bạn muốn luyện.',
    'files.start': 'Đi đến luyện tập',
    'files.wordOne': '{n} từ',
    'files.wordMany': '{n} từ',
    'files.topicOne': '{n} chủ đề',
    'files.topicMany': '{n} chủ đề',
    'files.selectedOne': 'Đã chọn {n} chủ đề · {w} từ',
    'files.selectedMany': 'Đã chọn {n} chủ đề · {w} từ',
    'files.noTopics': 'Chưa chọn chủ đề nào',
    'files.loadedAt': 'đã tải {when}',
    'files.loaded': 'đã tải',
    'lessons.kicker': 'Ngữ pháp',
    'lessons.title': 'Bài giảng',
    'lessons.sub': 'Xây nền ngữ pháp đủ chắc để viết B1/B2 rõ ràng và tự tin.',
    'lessons.atlasTitle': 'Bản đồ thì tiếng Pháp',
    'lessons.atlasSub': '18 chương · A2 đến B2',
    'lessons.openAtlas': 'Mở bản đồ thì tiếng Pháp',
    'lessons.continueAtlas': 'Học tiếp bản đồ thì tiếng Pháp',
    'lessons.handbookTitle': 'Grammaire progressive du français',
    'lessons.handbookBody': '52 chương lý thuyết của sách, cô đọng thành bài song ngữ: bảng, ví dụ và bài kiểm tra nhanh sau mỗi điểm.',
    'lessons.openHandbook': 'Mở khoá ngữ pháp',
    'lessons.continueHandbook': 'Học tiếp khoá ngữ pháp',
    'practice.kicker': 'Luyện mỗi ngày',
    'practice.title': 'Luyện tập',
    'practice.topics': 'Chủ đề',
    'practice.changeTopics': 'Đổi',
    'practice.pickTopics': 'chọn ít nhất một chủ đề để bắt đầu',
    'practice.noDeck': 'Hãy tải một tệp lớp học để chọn chủ đề.',
    'practice.sub': 'Trắc nghiệm, dịch một đoạn văn hoặc shadowing một câu. Chọn việc bạn cần hôm nay.',
    'practice.tipTitle': 'Một thắng lợi nhỏ mỗi ngày',
    'practice.tipBody': 'Mười lăm phút tập trung tốt hơn một giờ lướt qua. Hoàn thành một bài trắc nghiệm và một bài sản xuất, rồi dừng khi vẫn còn thấy nhẹ nhàng.',
    'practice.b2Title': 'Dành cho DELF B2',
    'practice.b2Body': 'Sau khi đoạn dịch VI → ngôn ngữ đích đạt điểm tuyệt đối, bạn nhận các gợi ý nâng cấp từ vựng và câu B1/B2 — luôn tùy chọn, không viết lại ý của bạn.',
    'practice.leaveConfirm': 'Rời bài luyện này? Lần làm hiện tại sẽ bị mất.',
    'exam.title': 'Phòng thi',
    'exam.body': 'Không gian luyện thi DELF B2 sẽ có ở bước tiếp theo. Trong lúc này, hãy dùng Luyện tập cho đoạn văn và trắc nghiệm.',
    'exam.cta': 'Đi đến luyện tập',
    'community.title': 'Cộng đồng',
    'community.body': 'Chia sẻ tiến bộ và luyện tập cùng người học khác. Không gian này sẽ sớm mở.',
    'progress.kicker': 'Hành trình của bạn',
    'progress.title': 'Tiến bộ của tôi',
    'progress.sub': 'Nhìn rõ từ vựng, ngữ pháp và chuỗi ngày học của bạn.',
    'progress.grammar': 'Khóa ngữ pháp',
    'progress.streak': 'Chuỗi hiện tại',
    'progress.best': 'Chuỗi tốt nhất: {n} ngày',
    'progress.accuracy': 'Độ chính xác',
    'progress.accuracyHint': 'Trên tất cả câu đã trả lời.',
    'home.goodMorning': 'Chào buổi sáng',
    'home.goodAfternoon': 'Chào buổi chiều',
    'home.goodEvening': 'Chào buổi tối',
    'home.streakAtRisk': 'Bạn đã bỏ một ngày — hoàn thành một nhiệm vụ hôm nay để giữ chuỗi {n} ngày.',
    'home.streakBest': 'Chuỗi tốt nhất: {n} ngày',
    'home.streakStart': 'Hoàn thành một nhiệm vụ hằng ngày để bắt đầu chuỗi.',
    'home.questJustCompleted': 'Chuỗi +1 — bạn đang có {n} ngày. Hẹn gặp lại ngày mai.',
    'home.questJustCompletedOne': 'Chuỗi +1 — bạn đang có {n} ngày. Hẹn gặp lại ngày mai.',
    'home.questLockedIn': 'Chuỗi hôm nay đã được tính — {n} ngày. Hẹn gặp lại ngày mai.',
    'home.questLockedInOne': 'Chuỗi hôm nay đã được tính — {n} ngày. Hẹn gặp lại ngày mai.',
    'exam.kicker': '{level} · Đề thi',
    'exam.questionPill': '{n} câu hỏi',
    'exam.pointPill': '{n} điểm',
    'exam.answeredPill': 'Đã trả lời {n} / {total}',
    'exam.timerTitle': 'Phiên làm bài 24 giờ của bạn',
    'exam.review': 'Xem lại câu trả lời',
    'exam.startOver': 'Làm lại từ đầu',
    'exam.resetConfirm': 'Bắt đầu lại đề này? Các câu trả lời và bài viết sẽ bị xóa.',
    'exam.resetDone': 'Đã làm mới đề. Phiên 24 giờ mới đã bắt đầu.',
    'exam.expiredToast': 'Phiên 24 giờ của bạn đã hết. Đề đã được làm mới với các câu trả lời trống.',
    'exam.piste': 'Bài nghe {n}',
    'exam.listenFree': 'Nghe bao nhiêu lần tùy thích — có thể tạm dừng và nghe lại.',
    'exam.audioMissing': 'Không tải được tệp âm thanh: tệp không có trong bản ứng dụng này, hoặc thiết bị này không thể kết nối tới nơi lưu tệp. Hãy sao chép thư mục exam/No.1 cạnh index.html, hoặc mở ứng dụng trên máy có tệp âm thanh.',
    'exam.exercise': 'Bài tập {n}',
    'exam.partMeta': '{n} bài tập · {p} điểm',
    'exam.essayMeta': '{p} điểm · mục tiêu {n} từ',
    'exam.essayTitle': 'Bài viết',
    'exam.essayLabel': 'Bài viết của bạn',
    'exam.essayPlaceholder': 'Viết bài của bạn ở đây (250 từ)…',
    'exam.wordCount': '{n} / {target} từ',
    'exam.feedback': 'AI nhận xét',
    'exam.feedbackBusy': 'Đang đọc bài của bạn…',
    'exam.feedbackEmpty': 'Hãy viết trước — AI cần văn bản để đọc.',
    'exam.feedbackNoAi': 'AI chưa được thiết lập. Mở Cài đặt → AI để dùng mô hình miễn phí hoặc thêm khóa.',
    'exam.feedbackError': 'Không tải được nhận xét. Hãy thử lại.',
    'exam.readText': 'Đọc văn bản',
    'exam.doc': 'Văn bản {n}',
    'exam.jump': 'Các phần của đề',
    'exam.footSession': 'Một phiên 24 giờ. Câu trả lời và bài viết được lưu trong trình duyệt này.',
    'exam.reviewTitle': 'Câu trả lời của bạn',
    'exam.reviewSub': 'Đã trả lời {n} / {total} câu',
    'exam.backToPaper': 'Quay lại đề',
    'exam.reviewNote': 'Đề này không kèm đáp án chính thức, nên hãy đối chiếu lựa chọn của bạn với phần nghe hoặc văn bản ở đây. Đây là tự kiểm tra, không phải điểm số.',
    'exam.reviewEssay': 'Đọc bài viết của bạn',
    'exam.essayEmpty': 'Chưa viết bài.',
    'exam.catalogueKicker': 'DELF B2 · Phòng thi',
    'exam.catalogueTitle': 'Danh sách đề thi',
    'exam.catalogueSub': 'Chọn một đề, xem nội dung rồi bắt đầu lượt làm bài 24 giờ.',
    'exam.paperCount': 'Số đề: {n}',
    'exam.open': 'Xem đề',
    'exam.start': 'Bắt đầu làm bài',
    'exam.continue': 'Tiếp tục làm bài',
    'exam.allExams': 'Tất cả đề',
    'exam.statusActive': 'Đang làm · còn {time}',
    'exam.statusExpired': 'Phiên đã hết hạn',
    'exam.statusReady': 'Chưa bắt đầu',
    'exam.audioPill': '{n} bài nghe',
    'exam.hoursPill': 'Giới hạn {n} giờ',
    'exam.detailsKicker': '{level} · Tổng quan đề',
    'exam.partsTitle': 'Nội dung đề thi',
    'exam.startNote': 'Đồng hồ 24 giờ bắt đầu khi bạn bấm Bắt đầu. Câu trả lời và bài viết được lưu trong trình duyệt này.',
    'exam.startNoteShort': 'Đồng hồ bắt đầu khi bấm Bắt đầu.',
    'exam.noKeyNote': 'Không có đáp án chính thức: cuối bài bạn tự xem lại câu trả lời.',
    'exam.methodNote': 'Nhận xét bài viết theo phương pháp viết DELF B2 của Stéphane Wattier (nội dung 14/25, hình thức 11/25).',
    'exam.noPapers': 'Chưa có đề thi nào.',
    'voice.automatic': 'Tự động',
    'voice.autoBest': 'Tự động — giọng {lang} tốt nhất hiện có',
    'voice.deviceLabel': 'Giọng {lang} trên thiết bị này',
    'voice.deviceIntro': 'Dùng giọng {lang} đã cài trên máy này. Trên Linux, Firefox dùng speech-dispatcher; giọng eSpeak mặc định nghe máy móc và có thể đọc sai. Chọn giọng khác ở đây nếu có, hoặc dùng Azure bên dưới để có giọng tự nhiên.',
    'voice.azureIntro': '<strong>Azure Speech</strong> cho bạn giọng {lang} tự nhiên trên mọi trình duyệt. Tạo một tài nguyên Azure Speech miễn phí, rồi dán khóa và khu vực vào đây. Gói miễn phí gồm 500K ký tự giọng đọc và 5 giờ chuyển giọng nói thành văn bản mỗi tháng. Văn bản được gửi đến Azure cho giọng đám mây; bản thân VocabLab không bao giờ tải lên hay lưu âm thanh của bạn.',
    'voice.limitNote': 'Chấm điểm Azure dùng độ chính xác, độ trôi chảy, độ đầy đủ và lỗi ở từng từ, đồng thời dùng 5 giờ chuyển giọng nói thành văn bản miễn phí. Azure không cho điểm ngữ điệu {lang} riêng.',
    'voice.browser': 'Giọng trình duyệt · {name}',
    'voice.none': 'Không có giọng {lang} trong trình duyệt — dùng Azure hoặc cài thêm',
    'levelUp.title': 'Nâng cấp',
    'levelUp.locked': 'Sửa hết ngữ pháp để mở khóa gợi ý B1/B2.',
    'levelUp.empty': 'Ngữ pháp đã hoàn hảo. Không tìm thấy gợi ý B1/B2 an toàn cho văn bản này.',
    'levelUp.sub': 'Gợi ý tùy chọn — ý của bạn vẫn là của bạn.',
    'levelUp.apply': 'Áp dụng',
    'levelUp.applyAll': 'Áp dụng tất cả an toàn',
    'levelUp.verified': 'Đã kiểm tra từ điển',
    'levelUp.aiOnly': 'Gợi ý từ AI',
    'levelUp.unavailable': 'Không kiểm tra được từ điển',
    'levelUp.notFound': 'Không thấy trong từ điển — hãy kiểm tra trước khi dùng',
    'levelUp.why': 'Vì sao',
    'levelUp.meaning': 'Nghĩa',
    'levelUp.source': 'Từ điển',
    'levelUp.loading': 'Đang tìm gợi ý nâng cấp B1/B2 an toàn…',
    'levelUp.waiting': 'Vẫn đang xử lý — {s} giây…',
    'levelUp.error': 'Không tải được gợi ý nâng cấp.',
    'levelUp.aiNeeded': 'Thêm khóa AI trong Cài đặt → AI để nhận gợi ý nâng cấp.',
    'corrections.title': 'Sửa lỗi',
    'corrections.allGood': 'Ngữ pháp đã hoàn hảo.',
    'corrections.apply': 'Áp dụng',
    'corrections.applyAll': 'Áp dụng tất cả',
    'corrections.corrected': 'Bản đã sửa',
    'corrections.words': 'Từ bắt buộc',
    'ui.english': 'Tiếng Anh',
    'ui.vietnamese': 'Tiếng Việt',
    'ui.french': 'Tiếng Pháp',
    'ui.languageChanged': 'Đã đổi ngôn ngữ giao diện.'
  };

  const FR = {
    'brand.tagline': 'Atelier DELF B2',
    'nav.home': 'Accueil',
    'nav.lessons': 'Leçons',
    'nav.practice': 'Pratique',
    'nav.exam': "Salle d'examen",
    'nav.community': 'Communauté',
    'nav.progress': 'Mes progrès',
    'nav.deck': 'Paquet actuel',
    'nav.learner': 'Apprenant',
    'files.kicker': 'Votre matériel',
    'files.title': 'Fichiers de la classe',
    'files.sub': 'Choisissez le paquet de vocabulaire et les thèmes à travailler.',
    'files.start': 'Aller à la pratique',
    'files.wordOne': '{n} mot',
    'files.wordMany': '{n} mots',
    'files.topicOne': '{n} thème',
    'files.topicMany': '{n} thèmes',
    'files.selectedOne': '{n} thème sélectionné · {w} mots',
    'files.selectedMany': '{n} thèmes sélectionnés · {w} mots',
    'files.noTopics': 'Aucun thème sélectionné',
    'files.loadedAt': 'chargé {when}',
    'files.loaded': 'chargé',
    'lessons.kicker': 'Grammaire',
    'lessons.title': 'Leçons',
    'lessons.sub': 'Construisez la grammaire nécessaire pour écrire clairement en B1/B2.',
    'lessons.atlasTitle': 'Atlas des temps français',
    'lessons.atlasSub': '18 chapitres · A2 à B2',
    'lessons.openAtlas': "Ouvrir l'atlas",
    'lessons.continueAtlas': "Continuer l'atlas",
    'lessons.handbookTitle': 'Grammaire progressive du français',
    'lessons.handbookBody': 'Les 52 chapitres de leçon du manuel, condensés en fiches bilingues : tableaux, exemples et un contrôle rapide après chaque point.',
    'lessons.openHandbook': 'Ouvrir le cours',
    'lessons.continueHandbook': 'Continuer le cours',
    'practice.kicker': 'Pratique quotidienne',
    'practice.title': 'Pratique',
    'practice.topics': 'Thèmes',
    'practice.changeTopics': 'Modifier',
    'practice.pickTopics': 'choisissez-en au moins un pour commencer',
    'practice.noDeck': 'Chargez un fichier de classe pour choisir des thèmes.',
    'practice.sub': 'Quiz, traduction d’un paragraphe ou shadowing d’une phrase. Choisissez ce dont vous avez besoin aujourd’hui.',
    'practice.tipTitle': 'Une petite victoire quotidienne',
    'practice.tipBody': 'Quinze minutes concentrées valent mieux qu’une heure de défilement. Terminez un quiz et une production, puis arrêtez-vous tant que cela reste facile.',
    'practice.b2Title': 'Conçu pour le DELF B2',
    'practice.b2Body': 'Après un paragraphe VI → langue cible parfait, vous recevez des améliorations B1/B2 facultatives — toujours optionnelles, jamais une réécriture de vos idées.',
    'practice.leaveConfirm': 'Quitter cet exercice ? Votre tentative en cours sera perdue.',
    'exam.title': "Salle d'examen",
    'exam.body': 'Un espace d’examen DELF B2 arrive bientôt. En attendant, utilisez Pratique pour les paragraphes et les quiz.',
    'exam.cta': 'Aller à la pratique',
    'community.title': 'Communauté',
    'community.body': 'Partagez vos progrès et pratiquez avec d’autres apprenants. Cet espace arrive bientôt.',
    'progress.kicker': 'Votre parcours',
    'progress.title': 'Mes progrès',
    'progress.sub': 'Une vue claire de votre vocabulaire, de votre grammaire et de votre série.',
    'progress.grammar': 'Cours de grammaire',
    'progress.streak': 'Série actuelle',
    'progress.best': 'Meilleure série : {n} jours',
    'progress.accuracy': 'Précision',
    'progress.accuracyHint': 'Sur toutes les questions répondues.',
    'home.goodMorning': 'Bonjour',
    'home.goodAfternoon': 'Bon après-midi',
    'home.goodEvening': 'Bonsoir',
    'home.streakAtRisk': 'Vous avez manqué un jour — terminez une quête aujourd’hui pour garder votre série de {n} jours.',
    'home.streakBest': 'Meilleure série : {n} jours',
    'home.streakStart': 'Terminez une quête quotidienne pour commencer une série.',
    'home.questJustCompleted': 'Série +1 — vous en êtes à {n} jours. À demain.',
    'home.questJustCompletedOne': 'Série +1 — vous en êtes à {n} jour. À demain.',
    'home.questLockedIn': 'Votre série du jour est validée — {n} jours. À demain.',
    'home.questLockedInOne': 'Votre série du jour est validée — {n} jour. À demain.',
    'exam.kicker': '{level} · Épreuve blanche',
    'exam.questionPill': '{n} questions',
    'exam.pointPill': '{n} points',
    'exam.answeredPill': '{n} / {total} répondues',
    'exam.timerTitle': 'Votre session de 24 heures',
    'exam.review': 'Voir mes réponses',
    'exam.startOver': 'Recommencer',
    'exam.resetConfirm': 'Recommencer cette épreuve ? Vos réponses et votre production seront effacées.',
    'exam.resetDone': 'Épreuve réinitialisée. Une nouvelle session de 24 heures a commencé.',
    'exam.expiredToast': 'Votre session de 24 heures est terminée. L’épreuve a redémarré avec des réponses vides.',
    'exam.piste': 'Piste {n}',
    'exam.listenFree': 'Écoutez autant de fois que vous voulez — pause et relecture libres.',
    'exam.audioMissing': 'Ce fichier audio n’a pas pu être chargé : il manque dans cette copie de l’application, ou cet appareil ne peut pas atteindre le serveur qui le contient. Copiez le dossier exam/No.1 à côté d’index.html, ou ouvrez l’application sur la machine qui possède l’audio.',
    'exam.exercise': 'Exercice {n}',
    'exam.partMeta': '{n} exercices · {p} points',
    'exam.essayMeta': '{p} points · objectif {n} mots',
    'exam.essayTitle': 'Production écrite',
    'exam.essayLabel': 'Votre article',
    'exam.essayPlaceholder': 'Rédigez votre article ici (250 mots)…',
    'exam.wordCount': '{n} / {target} mots',
    'exam.feedback': 'Retour de l’IA',
    'exam.feedbackBusy': 'Lecture de votre production…',
    'exam.feedbackEmpty': 'Écrivez d’abord — l’IA a besoin d’un texte.',
    'exam.feedbackNoAi': 'L’IA n’est pas configurée. Ouvrez Paramètres → IA pour utiliser le modèle gratuit ou ajouter une clé.',
    'exam.feedbackError': 'Le retour n’a pas pu être chargé. Réessayez.',
    'exam.readText': 'Lire le texte',
    'exam.doc': 'Document {n}',
    'exam.jump': 'Parties de l’épreuve',
    'exam.footSession': 'Une session de 24 heures. Réponses et production sont enregistrées dans ce navigateur.',
    'exam.reviewTitle': 'Vos réponses',
    'exam.reviewSub': '{n} réponses sur {total}',
    'exam.backToPaper': 'Revenir à l’épreuve',
    'exam.reviewNote': 'Aucun corrigé officiel n’est fourni avec cette épreuve : comparez vos choix avec l’audio ou le texte ci-dessus. C’est une auto-vérification, pas une note.',
    'exam.reviewEssay': 'Relire votre production',
    'exam.essayEmpty': 'Aucune production rédigée.',
    'exam.catalogueKicker': 'DELF B2 · Salle d’examen',
    'exam.catalogueTitle': 'Sujets d’examen',
    'exam.catalogueSub': 'Choisissez un sujet, vérifiez son contenu, puis lancez votre session de 24 heures.',
    'exam.paperCount': 'Sujets disponibles : {n}',
    'exam.open': 'Voir l’épreuve',
    'exam.start': 'Commencer l’épreuve',
    'exam.continue': 'Reprendre l’épreuve',
    'exam.allExams': 'Tous les sujets',
    'exam.statusActive': 'En cours · {time} restantes',
    'exam.statusExpired': 'Session expirée',
    'exam.statusReady': 'Pas commencée',
    'exam.audioPill': '{n} pistes audio',
    'exam.hoursPill': 'Limite de {n} heures',
    'exam.detailsKicker': '{level} · Aperçu de l’épreuve',
    'exam.partsTitle': 'Contenu de l’épreuve',
    'exam.startNote': 'Le compte à rebours de 24 heures démarre quand vous cliquez sur Commencer. Réponses et production sont enregistrées dans ce navigateur.',
    'exam.startNoteShort': 'Le chrono démarre au clic sur Commencer.',
    'exam.noKeyNote': 'Pas de corrigé officiel : à la fin, vous relisez vos propres réponses.',
    'exam.methodNote': 'Le retour sur la production suit la méthode DELF B2 de Stéphane Wattier (contenu 14/25, forme 11/25).',
    'exam.noPapers': 'Aucun sujet installé.',
    'voice.automatic': 'Automatique',
    'voice.autoBest': 'Automatique — meilleure voix {lang} disponible',
    'voice.deviceLabel': 'Voix {lang} sur cet appareil',
    'voice.deviceIntro': 'Utilisez une voix {lang} déjà installée sur cet ordinateur. Sous Linux, Firefox utilise speech-dispatcher ; sa voix eSpeak par défaut est robotique et peut mal prononcer certains mots. Choisissez une autre voix ici si vous en avez une, ou utilisez Azure ci-dessous pour une voix naturelle.',
    'voice.azureIntro': '<strong>Azure Speech</strong> vous offre une voix {lang} naturelle dans tous les navigateurs. Créez une ressource Azure Speech gratuite, puis collez sa clé et sa région ici. L’offre gratuite comprend 500 000 caractères de voix et 5 heures audio de reconnaissance vocale par mois. Le texte est envoyé à Azure pour la voix cloud ; VocabLab ne téléverse ni ne stocke jamais votre audio.',
    'voice.limitNote': 'L’évaluation Azure utilise la précision, l’aisance, l’exhaustivité et les erreurs au niveau des mots, et consomme vos 5 heures gratuites de reconnaissance vocale. Azure ne fournit pas de note de prosodie {lang} distincte.',
    'voice.browser': 'Voix du navigateur · {name}',
    'voice.none': 'Aucune voix {lang} dans le navigateur — utilisez Azure ou en installez une',
    'levelUp.title': 'Niveau supérieur',
    'levelUp.locked': 'Rendez la grammaire parfaite pour débloquer les améliorations B1/B2.',
    'levelUp.empty': 'La grammaire est parfaite. Aucune amélioration B1/B2 sûre trouvée pour ce texte.',
    'levelUp.sub': 'Améliorations facultatives — vos idées restent les vôtres.',
    'levelUp.apply': 'Appliquer',
    'levelUp.applyAll': 'Tout appliquer',
    'levelUp.verified': 'Vérifié dans le dictionnaire',
    'levelUp.aiOnly': 'Suggestion IA',
    'levelUp.unavailable': 'Vérification du dictionnaire indisponible',
    'levelUp.notFound': 'Introuvable dans le dictionnaire — à vérifier',
    'levelUp.why': 'Pourquoi',
    'levelUp.meaning': 'Sens',
    'levelUp.source': 'Dictionnaire',
    'levelUp.loading': 'Recherche d’améliorations B1/B2 sûres…',
    'levelUp.waiting': 'Toujours en cours — {s} s…',
    'levelUp.error': 'Impossible de charger les suggestions.',
    'levelUp.aiNeeded': 'Ajoutez une clé IA dans Paramètres → IA pour recevoir des suggestions.',
    'corrections.title': 'Corrections',
    'corrections.allGood': 'La grammaire est parfaite.',
    'corrections.apply': 'Appliquer',
    'corrections.applyAll': 'Tout corriger',
    'corrections.corrected': 'Version corrigée',
    'corrections.words': 'Mots obligatoires',
    'ui.english': 'Anglais',
    'ui.vietnamese': 'Vietnamien',
    'ui.french': 'Français',
    'ui.languageChanged': 'Langue de l’interface mise à jour.'
  };

  const CATALOGUES = { en: EN, vi: VI, fr: FR };
  // Exact English text/attribute → translated text. This lets the existing
  // markup and older dynamic strings translate without adding a key to every
  // button, label, option and Help paragraph.
  const STATIC = { en: {}, vi: {}, fr: {} };
  const ATTR_SRC = new WeakMap();
  let current = 'en';
  let observer = null;

  function lang() { return current; }

  function addStatic(code, map) {
    if (!STATIC[code] || !map) return;
    Object.keys(map).forEach(function (key) {
      if (key && map[key] != null) STATIC[code][key] = String(map[key]);
    });
  }

  function shouldSkip(node) {
    let el = node && node.nodeType === 1 ? node : (node && node.parentElement);
    if (!el) return true;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE') return true;
    if (el.closest && el.closest('#selUiLang, [data-i18n-skip]')) return true;
    if (el.closest && el.closest('[data-i18n], [data-i18n-html]')) return true;
    return false;
  }

  function translateNode(node) {
    if (!node || node.nodeType !== 3 || shouldSkip(node)) return;
    const raw = node.nodeValue || '';
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (!trimmed || /^[\s\d.,:;!?()\-–—·%\/]+$/.test(trimmed)) return;
    if (!node.__i18nSrc) node.__i18nSrc = trimmed;
    const source = node.__i18nSrc;
    const map = STATIC[current] || {};
    const value = current === 'en' ? source : (map[source] || source);
    if (value === trimmed) return;
    const lead = raw.match(/^\s*/)[0];
    const tail = raw.match(/\s*$/)[0];
    node.nodeValue = lead + value + tail;
  }

  function translateAttrs(root) {
    const scope = root || document;
    const els = scope.querySelectorAll ? scope.querySelectorAll('[placeholder], [title], [aria-label], [alt]') : [];
    els.forEach(function (el) {
      ['placeholder', 'title', 'aria-label', 'alt'].forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        if (el.closest && el.closest('[data-i18n-' + attr + ']')) return;
        const raw = el.getAttribute(attr);
        const trimmed = raw.replace(/\s+/g, ' ').trim();
        if (!trimmed) return;
        let src = ATTR_SRC.get(el);
        if (!src) { src = {}; ATTR_SRC.set(el, src); }
        if (!src[attr]) src[attr] = trimmed;
        const source = src[attr];
        const map = STATIC[current] || {};
        const value = current === 'en' ? source : (map[source] || source);
        if (value !== raw) el.setAttribute(attr, value);
      });
    });
  }

  function translateStatic(root) {
    const scope = root || document.body;
    if (!scope) return;
    if (scope.nodeType === 3) { translateNode(scope); return; }
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateNode(node);
    translateAttrs(scope);
  }

  function startObserver() {
    if (observer || typeof MutationObserver === 'undefined' || !document.body) return;
    observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 3) translateNode(node);
            else if (node.nodeType === 1) translateStatic(node);
          });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function t(key, vars) {
    const catalogue = CATALOGUES[current] || EN;
    let text = catalogue[key];
    if (text == null) text = EN[key];
    if (text == null) text = key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.replace(new RegExp('\\{' + name + '\\}', 'g'), String(vars[name]));
      });
    }
    return text;
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });
    ['placeholder', 'title', 'aria-label'].forEach(function (attr) {
      scope.querySelectorAll('[data-i18n-' + attr + ']').forEach(function (el) {
        const key = el.getAttribute('data-i18n-' + attr);
        if (key) el.setAttribute(attr, t(key));
      });
    });
    translateStatic(scope);
  }

  function setLang(value) {
    const next = CATALOGUES[value] ? value : 'en';
    current = next;
    document.documentElement.lang = next;
    apply(document);
    startObserver();
    document.dispatchEvent(new CustomEvent('vocablab:language', { detail: { lang: next } }));
    return next;
  }

  globalThis.I18n = {
    t: t,
    lang: lang,
    setLang: setLang,
    apply: apply,
    addStatic: addStatic,
    translateStatic: translateStatic,
    catalogues: CATALOGUES,
    static: STATIC
  };
})();
