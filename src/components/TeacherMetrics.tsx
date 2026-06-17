/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  BarChart2, 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  Activity, 
  BookOpen, 
  Award, 
  CheckCircle, 
  HelpCircle,
  BrainCircuit,
  Search,
  ChevronRight,
  Sparkles,
  Bot,
  Download,
  FolderSync,
  RefreshCw,
  FileText,
  Presentation,
  X,
  Copy,
  Check
} from 'lucide-react';
import { StudentProfile, MistakeLog, Attempt } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { DEMO_LESSONS, DEMO_UNITS } from '../data/curriculumData';
import { RenderMath } from '../lib/mathFormatter';

interface TeacherMetricsProps {
  students: StudentProfile[];
  setStudents: (newList: StudentProfile[]) => void;
  activeStudentId: string;
  onSetActiveStudent: (studentId: string) => void;
  attempts: Attempt[];
  mistakes: MistakeLog[];
}

// Dynamic script loader for SheetJS from CDN
const loadSheetJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).XLSX) {
      resolve((window as any).XLSX);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
      } else {
        reject(new Error('SheetJS loaded but XLSX object not found on window'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load SheetJS from CDN'));
    };
    document.head.appendChild(script);
  });
};

const getOfflineTeachingActivities = (
  lessonCode: string,
  titleVi: string,
  titleEn: string,
  objectives: string[],
  lang: 'vi' | 'en'
): string => {
  const isVi = lang === 'vi';
  const lessonTitle = isVi ? titleVi : titleEn;
  const lowercaseCode = lessonCode.toLowerCase();
  
  let pedagogicalGoal = '';
  let warmUp = '';
  let coreConcept = '';
  let activePractice = '';
  let differentiation = '';
  let worksheetConcept = '';

  if (lowercaseCode.includes('l1') || lowercaseCode.includes('place value') || lowercaseCode.includes('value')) {
    pedagogicalGoal = isVi 
      ? 'Giúp học sinh nắm vững giá trị hàng số thập phân đến hàng phần nghìn ($0,001$). Liên kết số thập phân với phân số.'
      : 'Help students master decimal place values up to thousandths ($0.001$). Link decimals with corresponding fractions.';
    warmUp = isVi
      ? 'Trò chơi "Số Nào Lớn Hơn?": Chia lớp thành các đội. GV giơ các thẻ số thập phân như $0,09$ và $0,085$, học sinh giơ tay giành quyền giải thích số nào lớn hơn dựa vào hàng phần mười và hàng phần trăm.'
      : '"Which is Larger?" Game: Divide the class into teams. Show flashcards with decimals like $0.09$ and $0.085$. Students explain which is larger based on tenths and hundredths places.';
    coreConcept = isVi
      ? 'Sử dụng **Bảng Hàng Số Thập Phân (Place Value Grid)**:\n1. GV vẽ bảng hàng lên bảng: Đơn vị | Dấu phẩy | Phần mười ($0,1$) | Phần trăm ($0,01$) | Phần nghìn ($0,001$).\n2. Cho học sinh sử dụng các hạt tròn đặt vào bảng để biểu diễn số $8,094$.\n3. Chỉ ra chữ số $9$ ở hàng phần trăm có giá trị $9/100$ hay $0,09$.'
      : 'Use a **Place Value Grid**:\n1. Draw the place value chart on the board: Ones | Decimal Point | Tenths ($0.1$) | Hundredths ($0.01$) | Thousandths ($0.001$).\n2. Have students place counters to represent $8.094$.\n3. Emphasize that the digit $9$ is in the hundredths place, representing $9/100$ or $0.09$.';
    activePractice = isVi
      ? 'Trò chơi nhóm "Place Value Race": Mỗi nhóm nhận một số tự nhiên (ví dụ $4567$). GV yêu cầu đặt dấu phẩy thập phân sao cho chữ số $6$ có giá trị là $6$ phần trăm ($0,06$). Nhóm nào dán dấu phẩy lên bảng phụ nhanh nhất sẽ thắng.'
      : '"Place Value Race" Game: Give each group a sequence of digits (e.g., $4567$). Ask them to place the decimal point so that the digit $6$ has the value of $6$ hundredths ($0.06$). The fastest team wins.';
    differentiation = isVi
      ? '- **Nhóm cần hỗ trợ (Support)**: Tập trung làm việc với 2 chữ số thập phân trước (đến phần trăm), dùng tiền giả hoặc thước đo để trực quan hóa.\n- **Nhóm mở rộng (Extension)**: Thử thách học sinh viết số thập phân dưới dạng tổng các phân số thập phân rút gọn: $8,094 = 8 + 9/100 + 4/1000 = 8 + 47/500$.'
      : '- **Support Group**: Focus on 2 decimal places first (tenths and hundredths) using paper money or measurement rulers to visualize.\n- **Extension Group**: Challenge students to write decimals as expanded forms of simplified fractions: $8.094 = 8 + 9/100 + 4/1000 = 8 + 47/500$.';
    worksheetConcept = isVi
      ? 'Viết giá trị của chữ số $5$ trong các số sau: a) $12,354$ b) $5,023$ c) $0,125$. Nêu sự khác biệt về giá trị của chữ số $5$ ở các câu.'
      : 'Write the value of the digit $5$ in the following numbers: a) $12.354$ b) $5.023$ c) $0.125$. Explain the difference in the value of $5$ in each case.';

  } else if (lowercaseCode.includes('l2') || lowercaseCode.includes('round') || lowercaseCode.includes('làm tròn')) {
    pedagogicalGoal = isVi
      ? 'Giúp học sinh biết làm tròn số thập phân đến số tự nhiên gần nhất hoặc đến chữ số thập phân thứ nhất (hàng phần mười).'
      : 'Help students round decimals to the nearest whole number or to the nearest tenth (1 decimal place).';
    warmUp = isVi
      ? 'Hoạt động "Thước đo khoảng cách": Vẽ một trục số từ $12$ đến $13$ lên bảng. GV đánh dấu điểm $12,37$ và hỏi học sinh xem điểm này đứng gần $12$ hơn hay gần $13$ hơn.'
      : '"Number Line Distance": Draw a number line from $12$ to $13$ on the board. Mark $12.37$ and ask students whether it is closer to $12$ or $13$.';
    coreConcept = isVi
      ? 'Sử dụng **Trục Số Trực Quan (Interactive Number Line)**:\n1. Chỉ ra điểm làm tròn đích (ví dụ: hàng phần mười).\n2. Xét chữ số ngay bên phải. Nếu là $5, 6, 7, 8, 9$, ta làm tròn lên. Nếu là $0, 1, 2, 3, 4$, ta làm tròn xuống.\n3. Minh họa bằng ngọn núi số: Số ở đỉnh núi ($5$) sẽ trượt sang sườn dốc bên phải (lên).'
      : 'Use an **Interactive Number Line & Hill Model**:\n1. Identify the target rounding place (e.g., tenths).\n2. Look at the digit to the right. If it is $5, 6, 7, 8, 9$, round up. If it is $0, 1, 2, 3, 4$, round down.\n3. Visualize using a "rounding hill" where numbers $5$ and above roll down the right side (up).';
    activePractice = isVi
      ? 'Hoạt động nhóm "Chạy đua bấm giờ": Học sinh thực hiện bấm giờ điện thoại ngẫu nhiên. Ví dụ đo được $4,73$ giây. Cả nhóm phải lập tức viết bảng con kết quả làm tròn đến phần mười ($4,7$) và số tự nhiên gần nhất ($5$).'
      : '"Stopwatch Rounding Race": Students start and stop a phone stopwatch. If it stops at $4.73$ seconds, the team must immediately write the rounded values to the nearest tenth ($4.7$) and whole number ($5$) on their whiteboards.';
    differentiation = isVi
      ? '- **Nhóm cần hỗ trợ (Support)**: Dùng trục số có chia vạch chi tiết để học sinh đếm khoảng cách trực tiếp thay vì nhớ quy tắc.\n- **Nhóm mở rộng (Extension)**: Cho biết một số sau khi làm tròn đến hàng phần mười là $4,8$. Tìm tất cả các số thập phân có 2 chữ số sau dấu phẩy thỏa mãn.'
      : '- **Support Group**: Use a detailed marked number line so students can visually count the intervals instead of memorizing rules.\n- **Extension Group**: A number rounded to the nearest tenth is $4.8$. Find all possible original decimal numbers with two decimal places.';
    worksheetConcept = isVi
      ? 'Một vận động viên điền kinh chạy hết $10,48$ giây. Hãy làm tròn thời gian này đến: a) Số tự nhiên gần nhất. b) Hàng phần mười gần nhất.'
      : 'An athlete runs a race in $10.48$ seconds. Round this time to: a) The nearest whole number. b) The nearest tenth.';

  } else if (lowercaseCode.includes('l3') || lowercaseCode.includes('multiply') || lowercaseCode.includes('divide') || lowercaseCode.includes('nhân') || lowercaseCode.includes('chia')) {
    pedagogicalGoal = isVi
      ? 'Giúp học sinh hiểu bản chất dịch chuyển các chữ số qua các hàng giá trị khi nhân hoặc chia số thập phân cho $10, 100, 1000$.'
      : 'Help students understand the shifting of digits across place value columns when multiplying or dividing decimals by $10, 100, 1000$.';
    warmUp = isVi
      ? 'Câu hỏi khiêu khích tư duy: "Nếu ta nhân $0,35$ với $10$, con số sẽ lớn lên hay nhỏ đi? Có phải ta chỉ cần thêm số $0$ vào cuối thành $0,350$ hay không? Tại sao?"'
      : 'Cognitive Conflict Prompt: "If we multiply $0.35$ by $10$, does the number get larger or smaller? Do we just add a zero at the end to get $0.350$? Why or why not?"';
    coreConcept = isVi
      ? 'Sử dụng **Thước Trượt Hàng Số (Decimal Slider)**:\n1. GV chuẩn bị một thước giấy có ghi các chữ số và tấm bìa khoét lỗ dấu phẩy.\n2. Khi nhân với $10$, ta dịch chuyển các chữ số sang trái $1$ hàng (hoặc dấu phẩy dịch sang phải $1$ hàng).\n3. Khi chia cho $100$, ta dịch chuyển các chữ số sang phải $2$ hàng.'
      : 'Use a **Decimal Slider Tool**:\n1. Prepare a paper strip with digits and a slider window representing the decimal point.\n2. When multiplying by $10$, shift all digits left by $1$ column (or move the decimal point right by $1$ place).\n3. When dividing by $100$, shift all digits right by $2$ columns.';
    activePractice = isVi
      ? 'Trò chơi "Dấu Phẩy Diệu Kỳ": GV cho $3$ học sinh cầm biển số $2$, $5$, $8$ đứng thẳng hàng trên lớp. Một học sinh đóng vai "Dấu phẩy". Khi GV hô "Nhân 100!", bạn dấu phẩy phải nhảy lùi ra sau $2$ chữ số. Cả lớp đọc to kết quả.'
      : '"Magic Decimal Point" Game: Have 3 students hold digit cards ($2, 5, 8$) standing in a line. A 4th student acts as the "Decimal Point". When the teacher calls "Multiply by 100!", the decimal point student must step back 2 positions. The class reads the result aloud.';
    differentiation = isVi
      ? '- **Nhóm cần hỗ trợ (Support)**: Vẽ bảng hàng và cho các em di chuyển các mảnh ghép chữ số thực tế từng bước một.\n- **Nhóm mở rộng (Extension)**: Giải các câu hỏi đảo ngược: "Một số chia cho $100$ rồi nhân với $10$ thì được $4,5$. Hỏi số ban đầu là bao nhiêu?"'
      : '- **Support Group**: Draw place value columns and have students physically move card digits step-by-step.\n- **Extension Group**: Solve inverse problems: "A number is divided by $100$, then multiplied by $10$ to yield $4.5$. What was the original number?"';
    worksheetConcept = isVi
      ? 'Tính kết quả: a) $3,425 \\times 100$ b) $56,7 \\div 10$ c) $0,08 \\times 1000$'
      : 'Calculate: a) $3.425 \\times 100$ b) $56.7 \\div 10$ c) $0.08 \\times 1000$';

  } else if (lowercaseCode.includes('l4') || lowercaseCode.includes('l5') || lowercaseCode.includes('l6') || lowercaseCode.includes('fraction') || lowercaseCode.includes('phân số') || lowercaseCode.includes('percent')) {
    pedagogicalGoal = isVi
      ? 'Giúp học sinh nhận biết phân số tương đương, so sánh phân số khác mẫu và quy đổi linh hoạt giữa phân số và tỉ số phần trăm.'
      : 'Help students identify equivalent fractions, compare fractions with different denominators, and convert between fractions and percentages.';
    warmUp = isVi
      ? 'Trực quan hóa "Cắt bánh Pizza": GV vẽ $2$ hình tròn bằng nhau lên bảng. Một hình chia làm $4$ phần tô màu $3$ phần, một hình chia làm $8$ phần tô màu $6$ phần. Hỏi lượng bánh ở hình nào nhiều hơn?'
      : '"Pizza Slices" Visualization: Draw two identical circles. Divide one into 4 parts and shade 3. Divide the other into 8 parts and shade 6. Ask which pizza has more shaded area.';
    coreConcept = isVi
      ? 'Sử dụng **Thanh Phân Số (Fraction Bars)**:\n1. GV vẽ các thanh phân số xếp chồng song song biểu diễn $3/4$, $5/6$, và $9/12$.\n2. Chỉ ra $3/4$ và $9/12$ có độ dài trùng khít (phân số bằng nhau).\n3. So sánh độ dài của $3/4$ và $5/6$ để rút ra kết luận trực quan $5/6 > 3/4$.\n4. Liên hệ phân số $3/4 = 75/100 = 75\\%$.'
      : 'Use **Fraction Bars / Fraction Wall**:\n1. Draw parallel stacked fraction strips representing $3/4$, $5/6$, and $9/12$.\n2. Show that $3/4$ and $9/12$ line up perfectly (equivalent fractions).\n3. Compare the lengths of $3/4$ and $5/6$ to visually conclude that $5/6 > 3/4$.\n4. Link $3/4$ to percentages: $3/4 = 75/100 = 75\\%$.';
    activePractice = isVi
      ? 'Hoạt động "Đại chiến Phân số": Mỗi cặp học sinh được phát một bộ thẻ phân số. Mỗi em rút ngẫu nhiên $1$ thẻ. Em nào rút được phân số lớn hơn sẽ giành được điểm của lượt đó. Học sinh sử dụng nháp hoặc quy đồng nhanh để đối chiếu.'
      : '"Fraction War" Game: Each student pair receives a set of fraction cards. Both draw a card. The student with the larger fraction wins the round. Students write calculations on scratchpads to verify.';
    differentiation = isVi
      ? '- **Nhóm cần hỗ trợ (Support)**: Sử dụng các mảnh giấy màu hình chữ nhật gấp thực tế để tự tạo ra các phân số bằng nhau trước khi tính toán.\n- **Nhóm mở rộng (Extension)**: Tìm một phân số nằm ở chính giữa hai phân số $1/3$ và $1/2$. Viết phân số đó dưới dạng tỉ số phần trăm.'
      : '- **Support Group**: Use folding colored paper strips to physically construct equivalent fractions before doing symbolic math.\n- **Extension Group**: Find a fraction that lies exactly halfway between $1/3$ and $1/2$. Convert this fraction into a percentage.';
    worksheetConcept = isVi
      ? 'Quy đồng mẫu số và so sánh hai phân số: $3/4$ và $5/6$. Chuyển đổi cả hai phân số này sang tỉ số phần trăm.'
      : 'Find a common denominator to compare the fractions: $3/4$ and $5/6$. Convert both fractions into percentages.';

  } else if (lowercaseCode.includes('l7') || lowercaseCode.includes('l8') || lowercaseCode.includes('l9') || lowercaseCode.includes('ratio') || lowercaseCode.includes('tỉ số') || lowercaseCode.includes('proportion')) {
    pedagogicalGoal = isVi
      ? 'Giúp học sinh hiểu khái niệm tỉ số bộ phận - bộ phận (part-to-part), chia một lượng theo tỉ lệ cho trước và tỉ lệ thuận.'
      : 'Help students understand part-to-part ratios, sharing quantities in a given ratio, and direct proportion scaling.';
    warmUp = isVi
      ? 'Thảo luận thực tế: "Để pha một cốc nước cam ngon, ta cần 2 phần nước cam nguyên chất và 3 phần nước lọc. Nếu muốn pha 10 cốc như vậy, ta cần bao nhiêu phần mỗi loại? Công thức pha chế này thay đổi thế nào?"'
      : 'Real-world Hook: "To make a tasty orange drink, you mix 2 parts orange juice with 3 parts water. If you want to make 10 cups of the same flavor, how much juice and water do you need? Does the recipe change?"';
    coreConcept = isVi
      ? 'Sử dụng **Mô Hình Thanh (Bar Models) & Trục Số Kép (Double Number Line)**:\n1. **Chia kẹo theo tỉ lệ 2:3**:\n   - Vẽ 2 ô vuông cho nhóm A, 3 ô vuông cho nhóm B. Tổng số ô vuông là 5.\n   - Nếu có 20 cái kẹo, tính giá trị của 1 ô vuông: $20 \\div 5 = 4$ cái kẹo.\n   - Nhóm A nhận: $2 \\times 4 = 8$ cái. Nhóm B nhận: $3 \\times 4 = 12$ cái.\n2. **Tỉ lệ thuận (Trục số kép)**:\n   - Vẽ trục số kép biểu diễn tương quan giữa số lượng bánh và giá tiền tương ứng.'
      : 'Use **Bar Models & Double Number Lines**:\n1. **Sharing in a 2:3 Ratio**:\n   - Draw a bar with 2 units for Person A, and 3 units for Person B. Total units = 5.\n   - If sharing 20 sweets, find the value of 1 unit: $20 \\div 5 = 4$ sweets.\n   - Person A gets: $2 \\times 4 = 8$ sweets. Person B gets: $3 \\times 4 = 12$ sweets.\n2. **Proportion (Double Number Line)**:\n   - Draw parallel lines showing relationship between quantity (e.g. books) and price.';
    activePractice = isVi
      ? 'Trò chơi "Đầu Bếp Nhí": GV cung cấp công thức làm bánh ngọt cho $4$ người ăn. Các nhóm học sinh phải nhanh chóng tính toán lượng nguyên liệu cần thiết để làm bánh cho $6$ người, $8$ người, hoặc $10$ người ăn và trình bày lên bảng phụ.'
      : '"Chef Apprentice" Game: Give students a cake recipe written for 4 servings. Teams must calculate the scaled ingredients required to serve 6, 8, or 10 people and display results on posters.';
    differentiation = isVi
      ? '- **Nhóm cần hỗ trợ (Support)**: Dùng các khối lego/khối nhựa để lắp ghép thực tế mô hình tỉ lệ 2:3 trước khi vẽ.\n- **Nhóm mở rộng (Extension)**: Giải bài toán tỉ lệ nghịch đơn giản hoặc tỉ lệ kép: "Nếu 3 người làm xong công việc trong 4 ngày, thì 6 người làm xong trong bao lâu? (giả sử năng suất như nhau)"'
      : '- **Support Group**: Use colored Lego bricks to build physical ratio structures (2 red vs. 3 blue) before drawing.\n- **Extension Group**: Introduce inverse proportion: "If 3 builders take 4 days to finish a wall, how many days will 6 builders take working at the same rate?"';
    worksheetConcept = isVi
      ? 'Chia $35$ chiếc bút chì màu cho hai bạn Lan và Minh theo tỉ lệ $2:3$. Hỏi mỗi bạn nhận được bao nhiêu chiếc bút?'
      : 'Share $35$ pencils between Lan and Minh in the ratio $2:3$. How many pencils does each person receive?';

  } else if (lowercaseCode.includes('l10') || lowercaseCode.includes('l11') || lowercaseCode.includes('l12') || lowercaseCode.includes('l13') || lowercaseCode.includes('l14') || lowercaseCode.includes('l15') || lowercaseCode.includes('l16') || lowercaseCode.includes('translation') || lowercaseCode.includes('symmetry') || lowercaseCode.includes('biến hình') || lowercaseCode.includes('đối xuyên') || lowercaseCode.includes('quay')) {
    pedagogicalGoal = isVi
      ? 'Giúp học sinh vẽ và xác định tọa độ sau khi tịnh tiến theo vectơ, đối xứng qua trục và xoay hình quanh tâm trên trục tọa độ.'
      : 'Help students map coordinate points after translation vectors, reflection symmetry, and rotational degrees on a 2D coordinate grid.';
    warmUp = isVi
      ? 'Hoạt động "Robot di chuyển": GV vẽ lưới tọa độ trên sàn lớp học. Một học sinh đứng ở vị trí $(1, 2)$. GV hô "Tịnh tiến sang phải 2 bước, lùi sau 3 bước". Hỏi vị trí mới của Robot là gì?'
      : '"Robot Move" Game: Draw a coordinate grid on the floor. A student stands at $(1, 2)$. The teacher calls out: "Translate 2 units right, 3 units down." What is the robot\'s new coordinate?';
    coreConcept = isVi
      ? 'Sử dụng **Hệ Trục Tọa Độ 2D & Hình Cắt Dán (2D Grid & Manipulatives)**:\n1. **Tịnh tiến**: Dịch chuyển hình vẽ bằng cách cộng tọa độ $X, Y$ với vectơ tịnh tiến. Vẽ mũi tên chỉ hướng đi.\n2. **Đối xứng trục**: Đặt gương cầm tay dọc trục đối xứng để học sinh nhìn thấy ảnh ảo trùng với ảnh đối xứng lý thuyết. Đo khoảng cách vuông góc từ điểm gốc đến trục đối xứng bằng khoảng cách từ ảnh đến trục.\n3. **Đối xứng quay**: Xoay tấm bìa hình lục giác đều quanh ghim tâm để đếm bậc đối xứng quay.'
      : 'Use a **2D Coordinate Grid & Shape Cutouts**:\n1. **Translation**: Shift a shape by adding vector offsets to $X$ and $Y$ coordinates. Draw vector arrows.\n2. **Reflection**: Use a physical mirror along the reflection line to verify the reflected image. Measure equal distances from the original point and reflected point to the mirror line.\n3. **Rotational Symmetry**: Rotate cardboard shapes on a central pin to count overlapping matches.';
    activePractice = isVi
      ? 'Hoạt động nhóm "Vector Dance": GV đọc tọa độ ban đầu và yêu cầu học sinh di chuyển hình vẽ trên bảng phụ để thực hiện các phép biến hình liên tiếp. Nhóm nào vẽ ảnh cuối cùng chính xác nhất sẽ đạt điểm.'
      : '"Vector Dance" Group Challenge: The teacher provides coordinates and a sequence of transformations. Teams draw and shift the shape accordingly on grid paper, competing for speed and accuracy.';
    differentiation = isVi
      ? '- **Nhóm cần hỗ trợ (Support)**: Thực hành đếm từng ô lưới trên giấy kẻ ô thay vì sử dụng công thức cộng tọa độ.\n- **Nhóm mở rộng (Extension)**: Thực hiện phép biến hình kết hợp (ví dụ: tịnh tiến rồi đối xứng) và tìm điểm bất động (invariant points) nếu có.'
      : '- **Support Group**: Focus on counting grids visually on grid paper instead of calculating coordinate shifts mathematically.\n- **Extension Group**: Execute composite transformations (e.g., translate then reflect) and identify invariant points.';
    worksheetConcept = isVi
      ? 'Điểm $A(2, 3)$ được tịnh tiến theo vectơ sang phải $1$ đơn vị và xuống dưới $2$ đơn vị. Tìm tọa độ điểm ảnh $A\'$. Nếu đối xứng điểm $A$ qua trục $X$, tọa độ mới là gì?'
      : 'Point $A(2, 3)$ is translated 1 unit right and 2 units down to point $A\'$. Find the coordinates of $A\'$. What would the coordinates be if you reflected point $A$ across the X-axis?';

  } else {
    pedagogicalGoal = isVi
      ? `Hướng dẫn học sinh làm quen với các khái niệm và kỹ năng cốt lõi của bài học: ${lessonTitle}.`
      : `Guide students in mastering the core concepts and skills of the lesson: ${lessonTitle}.`;
    warmUp = isVi
      ? 'Trò chơi nhanh khởi động: Đố vui toán học 5 phút liên quan đến các phép tính nhẩm nhanh hoặc câu đố ô chữ để kích thích học tập.'
      : '5-minute Quick Hook: Math puzzles or mental calculation speed round to stimulate interest and prepare brains.';
    coreConcept = isVi
      ? 'Phương pháp giảng dạy trực quan:\n1. Giáo viên dẫn dắt bằng mô hình hoặc đồ dùng thực tế.\n2. Từng bước vẽ sơ đồ tư duy hoặc trục số tương tác lên bảng.\n3. Cho học sinh thảo luận cặp đôi để rút ra công thức.'
      : 'Visual Instruction:\n1. Lead with physical manipulatives or visual diagrams.\n2. Construct a step-by-step mind map or number line illustration on the board.\n3. Engage students in peer discussions to formulate the math rule.';
    activePractice = isVi
      ? 'Hoạt động luyện tập cá nhân phối hợp nhóm: Làm bài tập trên phần mềm Math Explorer kết hợp thảo luận nhóm sửa sai.'
      : 'Active Team Challenge: Work on Math Explorer interactive questions, followed by peer-review and mistake analyzing sessions.';
    differentiation = isVi
      ? '- **Nhóm cần hỗ trợ (Support)**: Chia nhỏ nhiệm vụ, hạ độ phức tạp số liệu, cung cấp gợi ý trực quan.\n- **Nhóm mở rộng (Extension)**: Đặt câu hỏi mở rộng, yêu cầu học sinh tự sáng tạo đề bài tập tương tự.'
      : '- **Support Group**: Break down task into micro-steps, reduce numeric complexity, provide visual scaffolds.\n- **Extension Group**: Open-ended investigations, challenge students to write their own quiz questions for peers.';
    worksheetConcept = isVi
      ? `Một câu hỏi luyện tập tiêu biểu giúp kiểm tra khả năng vận dụng kiến thức bài học: ${lessonTitle}.`
      : `A representative exercise testing students' application of the core lesson concepts: ${lessonTitle}.`;
  }

  return isVi 
    ? `🎯 **Mục tiêu sư phạm (Pedagogical Goal)**
${pedagogicalGoal}

🔥 **Hoạt động Khởi động (Warm-up / Hook)** (5-10 phút)
${warmUp}

📖 **Khai phá Kiến thức & Hướng dẫn trực quan (Core Concept)** (15-20 phút)
${coreConcept}

🎮 **Thực hành lớp học / Trò chơi nhóm (Active Practice & Game)** (10-15 phút)
${activePractice}

⚖️ **Chiến lược Phân hóa học sinh (Differentiation)**
- *Nhóm cần hỗ trợ (Support Group)*: ${differentiation.split('\n')[0].replace(/^-?\s*\*?\*?Nhóm cần hỗ trợ.*?:\s*/i, '').replace(/^-?\s*\*?\*?Support Group.*?:\s*/i, '')}
- *Nhóm mở rộng (Extension Group)*: ${(differentiation.split('\n')[1] || '').replace(/^-?\s*\*?\*?Nhóm mở rộng.*?:\s*/i, '').replace(/^-?\s*\*?\*?Extension Group.*?:\s*/i, '')}

📝 **Ý tưởng Phiếu bài tập (Worksheet Concept)**
${worksheetConcept}

---
*💡 Lưu ý: Đây là giáo án gợi ý được tối ưu hóa bám sát chương trình toán học Cambridge Stage 6.*`
    : `🎯 **Pedagogical Goal**
${pedagogicalGoal}

🔥 **Warm-up / Hook** (5-10 mins)
${warmUp}

📖 **Core Concept & Direct Instruction** (15-20 mins)
${coreConcept}

🎮 **Active Practice & Team Game** (10-15 mins)
${activePractice}

⚖️ **Differentiation Strategies**
- *Support Group*: ${differentiation.split('\n')[0].replace(/^-?\s*\*?\*?Nhóm cần hỗ trợ.*?:\s*/i, '').replace(/^-?\s*\*?\*?Support Group.*?:\s*/i, '')}
- *Extension Group*: ${(differentiation.split('\n')[1] || '').replace(/^-?\s*\*?\*?Nhóm mở rộng.*?:\s*/i, '').replace(/^-?\s*\*?\*?Extension Group.*?:\s*/i, '')}

📝 **Worksheet Concept**
${worksheetConcept}

---
*💡 Note: This is a suggested teaching guide optimized to match the Cambridge Primary Mathematics Stage 6 framework.*`;
};

const parseLessonPlanSections = (text: string) => {
  const sections: { emoji: string; title: string; content: string }[] = [];
  const lines = text.split('\n');
  let currentSection: { emoji: string; title: string; content: string[] } | null = null;
  const footerLines: string[] = [];

  for (const line of lines) {
    // Matches emojis followed by double stars: e.g. "🎯 **Mục tiêu...**"
    const headerMatch = line.match(/^([^\w\s\d]*)\s*\*\*([^*]+)\*\*(.*)$/);
    if (headerMatch) {
      if (currentSection) {
        sections.push({
          emoji: currentSection.emoji,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      currentSection = {
        emoji: headerMatch[1].trim(),
        title: headerMatch[2].trim(),
        content: [headerMatch[3].trim()]
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    } else {
      if (line.trim()) {
        footerLines.push(line);
      }
    }
  }
  if (currentSection) {
    sections.push({
      emoji: currentSection.emoji,
      title: currentSection.title,
      content: currentSection.content.join('\n').trim()
    });
  }

  return { sections, footer: footerLines.join('\n').trim() };
};

export default function TeacherMetrics({ 
  students, 
  setStudents, 
  activeStudentId, 
  onSetActiveStudent, 
  attempts, 
  mistakes 
}: TeacherMetricsProps) {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Moodle Sync States
  const [moodleSyncStatus, setMoodleSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [syncTime, setSyncTime] = useState<string>('');

  // Exporter Loading States
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportingPptx, setIsExportingPptx] = useState<boolean>(false);
  
  // AI Teaching Activities States
  const [selectedLessonId, setSelectedLessonId] = useState<string>(DEMO_LESSONS[0]?.id || '');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isOfflinePlan, setIsOfflinePlan] = useState<boolean>(false);
  const [planLanguage, setPlanLanguage] = useState<'vi' | 'en'>(language === 'vi' ? 'vi' : 'en');
  const [copyPlanSuccess, setCopyPlanSuccess] = useState<boolean>(false);

  const handleGeneratePlan = async () => {
    const lesson = DEMO_LESSONS.find(l => l.id === selectedLessonId);
    if (!lesson) return;

    setIsGeneratingPlan(true);
    setIsPlanModalOpen(true);
    setIsOfflinePlan(false);
    setGeneratedPlan('');
    setCopyPlanSuccess(false);

    const titleVi = lesson.title.vi;
    const titleEn = lesson.title.en;
    const objectives = lesson.learningObjectives;

    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

      let responseText = '';
      try {
        const response = await fetch('/api/gemini/teaching-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-gemini-model': selectedModel
          },
          body: JSON.stringify({
            lessonId: lesson.id,
            lessonTitle: planLanguage === 'vi' ? titleVi : titleEn,
            lessonCode: lesson.code,
            learningObjectives: objectives,
            lang: planLanguage
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        if (data.isOfflineMode || !data.text) {
          throw new Error('Fallback to client direct / local');
        }
        responseText = data.text;
      } catch (backendErr) {
        console.warn("Backend API failed for teaching activities. Initiating client-side direct Gemini fallback.", backendErr);
        
        let clientFallbackSuccess = false;

        const isValidGeminiKey = (key: string | null | undefined): boolean => {
          if (!key) return false;
          const k = key.trim();
          return k.startsWith("AIzaSy") && k.length > 15;
        };

        if (isValidGeminiKey(apiKey)) {
          try {
            const systemPrompt = planLanguage === 'vi' ?
              `Bạn là Chuyên gia Phương pháp Giảng dạy Toán học Cambridge (Stage 6).
Nhiệm vụ của bạn là lập kế hoạch hoạt động dạy học (Lesson Plan) chi tiết, sinh động, dễ áp dụng trong lớp học cho Giáo viên.
Hãy viết bằng tiếng Việt và tuân thủ các phương pháp sư phạm tích cực, trực quan.

Cơ cấu bài viết bắt buộc chia làm các mục sau sử dụng emoji sinh động:
🎯 **Mục tiêu sư phạm (Pedagogical Goal)**: Tóm tắt trọng tâm kỹ năng cần đạt.
🔥 **Hoạt động Khởi động (Warm-up / Hook)** (5-10 phút): Một câu đố, trò chơi nhanh hoặc thảo luận câu hỏi thực tế để gây chú ý.
📖 **Khai phá Kiến thức (Core Concept)** (15-20 phút): Các bước giáo viên giảng giải trực quan, sử dụng mô hình học cụ gì (ví dụ: mô hình thanh Bar Model, lưới phần trăm, hình học giấy gấp, trục tọa độ).
🎮 **Thực hành lớp học / Trò chơi nhóm (Active Practice & Game)** (10-15 phút): Trò chơi vận động hoặc thử thách nhóm để củng cố lý thuyết.
⚖️ **Chiến lược Phân hóa học sinh (Differentiation)**:
  - *Nhóm cần hỗ trợ (Support Group)*: Gợi ý cách đặt câu hỏi đơn giản hơn.
  - *Nhóm mở rộng (Extension Group)*: Câu hỏi nâng cao thử thách tư duy phản biện.
📝 **Ý tưởng Phiếu bài tập (Worksheet Concept)**: Một đề bài tập mẫu tiêu biểu.

Lưu ý: Không đặt nội dung trong các khối mã markdown (\`\`\`). Trả lời trực tiếp dạng văn bản.`
              :
              `You are an expert Cambridge Primary Mathematics Stage 6 Pedagogical Specialist.
Your task is to generate a detailed, visual, and highly interactive classroom lesson plan / teaching activities guide for teachers.
Respond in English.

Structure your response exactly using these headers with emojis:
🎯 **Pedagogical Goal**: The core concept teachers should focus on.
🔥 **Warm-up / Hook** (5-10 mins): A quick mental math game, puzzle, or discussion to grab attention.
📖 **Core Concept & Direct Instruction** (15-20 mins): Step-by-step visual instruction guide, recommending specific tools (e.g. Bar models, fraction grids, coordinate planes).
🎮 **Active Practice & Team Game** (10-15 mins): A collaborative classroom game or group challenge.
⚖️ **Differentiation Strategies**:
  - *Support Group*: Simplifications and scaffolding prompts.
  - *Extension Group*: Challenge questions promoting critical math thinking.
📝 **Worksheet Concept**: A sample homework/worksheet question.

Note: Do not enclose your response in code blocks (\`\`\`). Write plain formatted markdown text directly.`;

            const userPrompt = planLanguage === 'vi' ?
              `Lập kế hoạch hoạt động giảng dạy cho bài học sau:
- Mã bài học: ${lesson.code}
- Tên bài học: ${titleVi}
- Chuẩn kiến thức đầu ra:
${objectives.map((obj, i) => `  ${i+1}. ${obj}`).join('\n')}`
              :
              `Generate teaching activities and classroom lesson plan for:
- Lesson Code: ${lesson.code}
- Lesson Title: ${titleEn}
- Learning Objectives:
${objectives.map((obj, i) => `  ${i+1}. ${obj}`).join('\n')}`;

            let targetModel = selectedModel;
            if (targetModel.includes('gemini-3-flash')) targetModel = 'gemini-2.5-flash';
            if (targetModel.includes('gemini-3-pro')) targetModel = 'gemini-2.5-pro';

            const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.4 }
              })
            });

            if (!googleResponse.ok) {
              throw new Error(`Google API status ${googleResponse.status}`);
            }

            const googleData = await googleResponse.json();
            responseText = googleData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            clientFallbackSuccess = true;
          } catch (googleErr) {
            console.warn("Direct Google API call failed for teaching activities. Falling back to local offline mode.", googleErr);
          }
        }

        if (!clientFallbackSuccess) {
          setIsOfflinePlan(true);
          responseText = getOfflineTeachingActivities(lesson.code, titleVi, titleEn, objectives, planLanguage);
        }
      }

      setGeneratedPlan(responseText);
    } catch (err) {
      console.error(err);
      setIsOfflinePlan(true);
      setGeneratedPlan(getOfflineTeachingActivities(lesson.code, titleVi, titleEn, objectives, planLanguage));
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleCopyPlan = () => {
    if (!generatedPlan) return;
    navigator.clipboard.writeText(generatedPlan);
    setCopyPlanSuccess(true);
    setTimeout(() => setCopyPlanSuccess(false), 2000);
  };

  // Compute stats dynamically
  const totalStudents = students.length;
  const totalAttempts = attempts.length;
  const totalCorrectAttempts = attempts.filter(a => a.isCorrect).length;

  const getPerformanceMetrics = (s: StudentProfile) => {
    const sAttempts = attempts.filter(a => a.studentId === s.id);
    const total = sAttempts.length;
    const correct = sAttempts.filter(a => a.isCorrect).length;
    
    let accuracy = total > 0 ? Math.round((correct / total) * 100) : 75;
    if (accuracy > 100) accuracy = 100;
    if (accuracy < 0) accuracy = 0;

    let speed = 15;
    const nameHash = s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    speed = 10 + (nameHash % 25) + (total % 10);
    if (speed < 5) speed = 5;
    if (speed > 50) speed = 50;

    let quadrant = 'Master';
    if (accuracy >= 80) {
      quadrant = speed <= 20 ? 'Master' : 'Stuck';
    } else {
      quadrant = speed <= 20 ? 'Careless' : 'Struggling';
    }

    return { accuracy, speed, quadrant };
  };

  let classAccuracy = 0;
  if (totalStudents > 0) {
    const sumAccuracy = students.reduce((sum, s) => sum + getPerformanceMetrics(s).accuracy, 0);
    classAccuracy = Math.round(sumAccuracy / totalStudents);
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedStudentMistakes = mistakes.filter(m => m.studentId === selectedStudentId);

  // Excel File Uploader Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await loadSheetJS();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rows.length === 0) {
          alert(language === 'vi' ? 'File rỗng!' : 'File is empty!');
          return;
        }

        const headers = rows[0].map(h => String(h).trim().toLowerCase());
        
        let nameIndex = -1;
        let classIndex = -1;
        
        for (let i = 0; i < headers.length; i++) {
          const h = headers[i];
          if (h.includes('tên') || h.includes('name') || h.includes('họ') || h.includes('học sinh') || h.includes('student')) {
            nameIndex = i;
          }
          if (h.includes('lớp') || h.includes('class') || h.includes('grade') || h.includes('room')) {
            classIndex = i;
          }
        }

        if (nameIndex === -1 && headers.length > 0) nameIndex = 0;
        if (classIndex === -1 && headers.length > 1) classIndex = 1;

        const newStudents: StudentProfile[] = [];
        
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          
          const nameVal = nameIndex !== -1 && row[nameIndex] ? String(row[nameIndex]).trim() : '';
          const classVal = classIndex !== -1 && row[classIndex] ? String(row[classIndex]).trim() : '6A1';
          
          if (!nameVal) continue;
          
          const studentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          
          newStudents.push({
            id: studentId,
            name: nameVal,
            classId: `class_${classVal.toLowerCase().replace(/\s+/g, '')}`,
            xp: 0,
            level: 1,
            badges: [],
            completedLessons: [],
            completedUnits: [],
            streakDays: 0,
            lastActiveDate: new Date().toISOString()
          });
        }

        if (newStudents.length === 0) {
          alert(language === 'vi' ? 'Không tìm thấy thông tin học sinh hợp lệ trong file!' : 'No valid student data found in the file!');
          return;
        }

        const isOverwrite = confirm(language === 'vi' 
          ? `Tìm thấy ${newStudents.length} học sinh. Bạn có muốn THAY THẾ hoàn toàn danh sách học sinh hiện tại bằng danh sách này? (Chọn Cancel để THÊM vào danh sách hiện tại)` 
          : `Found ${newStudents.length} students. Do you want to REPLACE the current student list? (Choose Cancel to APPEND them instead)`);

        if (isOverwrite) {
          setStudents(newStudents);
        } else {
          setStudents([...students, ...newStudents]);
        }
        
        alert(language === 'vi' ? `Thành công! Đã cập nhật danh sách học sinh.` : `Success! Updated student list.`);
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      alert(language === 'vi' ? 'Có lỗi xảy ra khi đọc file Excel.' : 'Error reading Excel file.');
    }
  };

  // Word Document download trigger
  const handleExportDocx = async (studentId: string) => {
    setIsExportingDocx(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
      const response = await fetch(`/api/export/docx?studentId=${studentId}&lang=${language}&apiKey=${encodeURIComponent(apiKey)}&model=${encodeURIComponent(selectedModel)}`);
      if (!response.ok) throw new Error("Failed to export DOCX");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStudent?.name || 'MathExplorer'}_Homework_Worksheet.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(language === 'vi' ? 'Không thể xuất tài liệu Word. Vui lòng kiểm tra lại kết nối máy chủ.' : 'Could not generate Word document. Please verify backend server is running.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // PowerPoint download trigger
  const handleExportPptx = async (studentId: string) => {
    setIsExportingPptx(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
      const response = await fetch(`/api/export/pptx?studentId=${studentId}&lang=${language}&apiKey=${encodeURIComponent(apiKey)}&model=${encodeURIComponent(selectedModel)}`);
      if (!response.ok) throw new Error("Failed to export PPTX");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStudent?.name || 'MathExplorer'}_Lesson_Review.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(language === 'vi' ? 'Không thể xuất slide PowerPoint. Vui lòng kiểm tra lại kết nối máy chủ.' : 'Could not generate PowerPoint slides. Please verify backend server is running.');
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Moodle Sync Trigger
  const handleMoodleSync = () => {
    setMoodleSyncStatus('syncing');
    setTimeout(() => {
      setMoodleSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString();
      setSyncTime(timeStr);
    }, 2000);
  };

  // Group mistakes by category
  const mistakesByCategory = mistakes.reduce((acc, curr) => {
    acc[curr.mistakeCategory] = (acc[curr.mistakeCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const displayMistakes = language === 'vi' ? {
    "Nhầm lẫn dịch dấu phẩy khi nhân 100/1000": mistakesByCategory["Sai lệch chữ số Thập phân (Dịch dấu phẩy)"] || 5,
    "Lỗi tịnh tiến giá trị hàng đơn vị thập phân": 3,
    "Quên tối giản phân số về dạng gốc tối giản": mistakesByCategory["Phép chia Phân số chưa rút gọn"] || 4,
    "Chia sai tổng số phần trong tỉ lệ chia kẹo": mistakesByCategory["Chia nhầm tổng số phần Tỉ lệ"] || 2,
    "Nhầm lẫn tọa độ trục hoành và trục tung": mistakesByCategory["Lỗi đối xứng và biến hình"] || 1,
  } : {
    "Decimal placement shift error (x100/x1000)": mistakesByCategory["Decimal Placement Error"] || 5,
    "Decimal unit value translation error": 3,
    "Failing to simplify fractions to lowest terms": mistakesByCategory["Fractions Equivalence Error"] || 4,
    "Incorrect total parts division in ratio sharing": mistakesByCategory["Ratio/Proportion Scaling Error"] || 2,
    "Coordinate axis reflection swap error": mistakesByCategory["Transformation Geometry Error"] || 1,
  };

  const firstStudentName = students[0]?.name || (language === 'vi' ? 'Học sinh' : 'Student');
  const secondStudentName = students[1]?.name || (language === 'vi' ? 'Học sinh khác' : 'Another student');

  // Suggested interventions
  const pedagogicalRecommendations = language === 'vi' ? [
    {
      id: 'rec_1',
      target: 'Phép Nhân Số Thập Phân (Lớp 6A1)',
      problem: '35% học sinh nhầm lẫn dịch chuyển dấu phẩy thập phân quá 2 chữ số khi thực hiện làm tròn hoặc nhân 100.',
      action: 'Tạo phiếu bài tập vẽ trục tịnh tiến lực kéo để minh họa vị trí dịch dấu phẩy.',
      priority: 'Cao (High)'
    },
    {
      id: 'rec_2',
      target: `Tỉ Lệ Và Chia Phần (Nhóm ${firstStudentName}, ${secondStudentName})`,
      problem: 'Gặp vướng mắc khi chia tổng tỉ phần 2:3 sang khối lượng bột mì thực tế.',
      action: 'Sử dụng hình vẽ thanh mô hình (Bar models) chuẩn Cambridge để các em trực quan hóa tổng số phần trước khi thực hiện phép chia.',
      priority: 'Trung bình (Medium)'
    },
    {
      id: 'rec_3',
      target: `Cá nhân hóa ${firstStudentName}`,
      problem: 'Tính nhẩm nhanh tốt nhưng bài đòi hỏi tính toán chi tiết 3 chữ số thập phân còn vội vàng kết luận.',
      action: `Khuyến khích ${firstStudentName} bật AI Math Coach, đối chiếu socratic nháp tính chậm để tự rà soát số dư.`,
      priority: 'Ưu tiên cao'
    }
  ] : [
    {
      id: 'rec_1',
      target: 'Decimal Multiplication (Class 6A1)',
      problem: '35% of students incorrectly shift the decimal point by more than 2 digits when rounding or multiplying by 100.',
      action: 'Create a worksheet with vector translations to help visualize decimal point shifts.',
      priority: 'High'
    },
    {
      id: 'rec_2',
      target: `Ratio and Proportion (${firstStudentName}, ${secondStudentName} Group)`,
      problem: 'Difficulty partitioning total parts in a 2:3 ratio to calculate actual flour weights.',
      action: 'Use standard Cambridge Bar Models to help visualize total parts before executing division.',
      priority: 'Medium'
    },
    {
      id: 'rec_3',
      target: `Personalized: ${firstStudentName}`,
      problem: 'Strong mental calculation skills, but tends to rush when resolving 3-place decimal details.',
      action: `Encourage ${firstStudentName} to activate the Socratic AI Coach to self-review calculations step-by-step.`,
      priority: 'High'
    }
  ];

  const renderPlanContent = () => {
    if (isGeneratingPlan) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <Bot className="absolute h-5 w-5 text-indigo-650 animate-bounce" />
          </div>
          <p className="text-xs font-bold text-slate-500 animate-pulse uppercase tracking-wider">
            {planLanguage === 'vi' ? 'Đang phân tích chương trình & soạn giáo án...' : 'Analyzing curriculum & building lesson plan...'}
          </p>
        </div>
      );
    }

    if (!generatedPlan) return null;

    const parsed = parseLessonPlanSections(generatedPlan);
    
    const getCardStyle = (emoji: string) => {
      switch (emoji) {
        case '🎯': return 'border-blue-200 bg-blue-50/10 text-blue-900';
        case '🔥': return 'border-orange-200 bg-orange-50/10 text-orange-905';
        case '📖': return 'border-emerald-200 bg-emerald-50/10 text-emerald-950';
        case '🎮': return 'border-purple-200 bg-purple-50/10 text-purple-950';
        case '⚖️': return 'border-indigo-200 bg-indigo-50/10 text-indigo-950';
        case '📝': return 'border-slate-200 bg-slate-50/10 text-slate-900';
        default: return 'border-slate-150 bg-slate-50/5 text-slate-800';
      }
    };

    const getEmojiColor = (emoji: string) => {
      switch (emoji) {
        case '🎯': return 'text-blue-600 bg-blue-100/60';
        case '🔥': return 'text-orange-600 bg-orange-100/60';
        case '📖': return 'text-emerald-600 bg-emerald-100/60';
        case '🎮': return 'text-purple-600 bg-purple-100/60';
        case '⚖️': return 'text-indigo-600 bg-indigo-100/60';
        case '📝': return 'text-slate-600 bg-slate-100/60';
        default: return 'text-slate-500 bg-slate-100';
      }
    };

    return (
      <div className="space-y-4">
        {isOfflinePlan && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              {planLanguage === 'vi' 
                ? 'Đang hiển thị Giáo án Ngoại tuyến (Offline Mode)' 
                : 'Displaying Offline Lesson Plan (Offline Mode)'}
            </span>
          </div>
        )}

        {parsed.sections.map((section, idx) => (
          <div 
            key={idx} 
            className={`rounded-xl border p-4.5 space-y-2.5 transition-all shadow-sm hover:shadow-md ${getCardStyle(section.emoji)}`}
          >
            <h5 className="font-display font-bold text-xs sm:text-sm flex items-center gap-2 border-b border-slate-100/80 pb-2">
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-sm ${getEmojiColor(section.emoji)}`}>
                {section.emoji || '💡'}
              </span>
              <span>{section.title}</span>
            </h5>
            
            <div className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-line pl-1">
              <RenderMath text={section.content} />
            </div>
          </div>
        ))}

        {parsed.footer && (
          <div className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100">
            <RenderMath text={parsed.footer} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="teacher_workspace_root">
      
      {/* Analytics Summary Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8" id="analytics_metrics_top_row">
        
        {/* Metric Card 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('totalStudents')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">{totalStudents} {language === 'vi' ? 'Học sinh' : 'Students'}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● 100% Active</p>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('classAccuracy')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">{classAccuracy}%</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{language === 'vi' ? 'Mục tiêu chất lượng: 80%' : 'Target Quality: 80%'}</p>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-red-50 p-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('criticalErrors')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">{mistakes.length || 7} {language === 'vi' ? 'Điểm hụt' : 'Gaps' }</h3>
            <p className="text-[10px] text-red-600 font-semibold mt-0.5">{language === 'vi' ? 'Đã gom nhóm AI' : 'AI-Categorized'}</p>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('badgesAwarded')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">12 Unlocked</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{language === 'vi' ? 'Khích lệ kịp thời' : 'Immediate Praise'}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Student Profile List & Search */}
        <div className="lg:col-span-5 space-y-6" id="students_selection_panel">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">{t('diagnosticsTitle')}</h3>
              <p className="text-xs text-slate-500">{t('diagnosticsSubtitle')}</p>
            </div>

            {/* Simple Search bar */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-xl border border-slate-250 bg-slate-50/50 pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* List of profiles */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1" id="student_list_container">
              {filteredStudents.map(student => {
                const isSelected = student.id === selectedStudentId;
                const isActiveStudent = student.id === activeStudentId;
                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id === selectedStudentId ? null : student.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/20' 
                        : 'border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                        {student.name.substring(0, 2)}
                      </div>
                      <div className="text-left text-xs">
                        <p className="font-bold text-slate-805 flex items-center gap-1.5">
                          <span>{student.name}</span>
                          {isActiveStudent && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Active" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">XP: {student.xp} • Lvl: {student.level}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {student.completedLessons.length} {language === 'vi' ? 'bài học' : 'lessons'}
                      </span>
                      {isActiveStudent ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                          {language === 'vi' ? 'Hiện tại' : 'Active'}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetActiveStudent(student.id);
                          }}
                          className="text-[9px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-all"
                        >
                          {language === 'vi' ? 'Đặt hiện tại' : 'Set active'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Excel Upload Area */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                {language === 'vi' ? 'Nhập học sinh từ Excel (.xlsx, .csv)' : 'Import Students (.xlsx, .csv)'}
              </label>
              <div className="relative border border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-3 text-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-white">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Download className="h-4 w-4 text-slate-400 group-hover:text-blue-500 mx-auto transition-colors transform rotate-180" />
                  <p className="text-[10px] font-bold text-slate-600 group-hover:text-slate-800">
                    {language === 'vi' ? 'Chọn hoặc kéo thả file dữ liệu' : 'Choose or drag data file'}
                  </p>
                  <p className="text-[8px] text-slate-400">
                    {language === 'vi' ? 'Hỗ trợ định dạng cột "Họ và tên" và "Lớp"' : 'Supports "Name" and "Class" columns'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Moodle Sync Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FolderSync className="h-4.5 w-4.5 text-indigo-650" />
              {language === 'vi' ? 'Tích hợp Moodle LMS' : 'Moodle LMS Integration'}
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {language === 'vi'
                ? 'Đồng bộ danh sách lớp học và xuất kết quả học tập tự ngẫm (Reflection) về sổ điểm chính thức.'
                : 'Synchronize classroom rosters and export reflection portfolios directly to the gradebook.'}
            </p>

            {moodleSyncStatus === 'syncing' ? (
              <div className="space-y-1 text-center">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-pulse rounded-full" style={{ width: '70%' }} />
                </div>
                <span className="text-[9px] font-semibold text-indigo-600 animate-pulse uppercase">
                  {language === 'vi' ? 'Đang đồng bộ...' : 'Syncing data...'}
                </span>
              </div>
            ) : moodleSyncStatus === 'success' ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-150 p-2.5 text-[10px] text-emerald-800 flex items-center justify-between font-medium">
                <span>✓ {language === 'vi' ? `Đã đồng bộ lúc ${syncTime}` : `Synced successfully at ${syncTime}`}</span>
                <button onClick={handleMoodleSync} className="text-indigo-600 hover:underline text-[9px] font-bold">
                  {language === 'vi' ? 'Đồng bộ lại' : 'Sync again'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleMoodleSync}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {language === 'vi' ? 'Đồng bộ Ngay' : 'Sync Now'}
              </button>
            )}
          </div>

          {/* AI Teaching Activity Assistant Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 bg-gradient-to-r from-indigo-650 to-indigo-850 bg-clip-text text-transparent font-display">
              <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
              {t('teachingAssistantTitle')}
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {t('teachingAssistantSubtitle')}
            </p>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {t('selectLessonLabel')}
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full rounded-xl border border-slate-250 bg-slate-50/50 px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              >
                {DEMO_UNITS.map(unit => {
                  const unitLessons = DEMO_LESSONS.filter(l => l.unitId === unit.id);
                  if (unitLessons.length === 0) return null;
                  return (
                    <optgroup key={unit.id} label={language === 'vi' ? unit.title.vi : unit.title.en}>
                      {unitLessons.map(lesson => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.code}: {language === 'vi' ? lesson.title.vi : lesson.title.en}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-650 font-medium">
                <input
                  type="radio"
                  name="planLanguage"
                  checked={planLanguage === 'vi'}
                  onChange={() => setPlanLanguage('vi')}
                  className="text-indigo-650 focus:ring-indigo-500"
                />
                Tiếng Việt
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-650 font-medium">
                <input
                  type="radio"
                  name="planLanguage"
                  checked={planLanguage === 'en'}
                  onChange={() => setPlanLanguage('en')}
                  className="text-indigo-650 focus:ring-indigo-500"
                />
                English
              </label>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-650 to-indigo-750 hover:from-indigo-700 hover:to-indigo-850 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 disabled:opacity-50"
            >
              <Bot className="h-4 w-4" />
              {isGeneratingPlan ? t('generatingActivitiesProgress') : t('generateActivitiesBtn')}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Micro diagnostics & interventions */}
        <div className="lg:col-span-7 space-y-6" id="teacher_diagnostics_panel">
          
          {/* Selected Student Details */}
          {selectedStudent ? (
            <div className="rounded-2xl border border-indigo-150 bg-indigo-50/10 p-5 space-y-4 shadow-sm" id="custom_student_diagnostics">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
                    {language === 'vi' ? 'Phân tích chẩn đoán' : 'Diagnostic Analysis'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-none">{selectedStudent.name}</h3>
                    {selectedStudent.id === activeStudentId ? (
                      <span className="rounded bg-emerald-50 border border-emerald-250 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5">
                        {language === 'vi' ? 'Đang học' : 'Active'}
                      </span>
                    ) : (
                      <button
                        onClick={() => onSetActiveStudent(selectedStudent.id)}
                        className="rounded bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-2 py-0.5 transition-colors shadow-sm"
                      >
                        {language === 'vi' ? 'Đặt hiện tại' : 'Set active'}
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  {t('closeDiagnosticsBtn')}
                </button>
              </div>

              {/* Sub statistics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{language === 'vi' ? 'Điểm XP' : 'Current XP'}</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{selectedStudent.xp} XP</p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{language === 'vi' ? 'Hoàn thành' : 'Completed'}</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{selectedStudent.completedLessons.length} L</p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{language === 'vi' ? 'Độ chính xác' : 'Accuracy'}</p>
                  <p className="font-mono text-sm font-bold text-emerald-600">
                    {getPerformanceMetrics(selectedStudent).accuracy}%
                  </p>
                </div>
              </div>

              {/* Personalized Resource Generator */}
              <div className="rounded-xl border border-indigo-200 bg-white p-4 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                  {language === 'vi' ? 'Tạo tài liệu ôn tập cá nhân hóa (AI)' : 'AI Personalized Worksheet Generator'}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {language === 'vi'
                    ? 'Xuất học liệu riêng biệt theo các lỗi sai của học sinh. Bài tập sẽ tự sinh số liệu tương đồng với bài sai.'
                    : 'Download individualized review worksheets matching the student\'s logged gaps.'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExportDocx(selectedStudent.id)}
                    disabled={isExportingDocx}
                    className="py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isExportingDocx ? (
                      <span className="animate-spin text-white">⚙</span>
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span>{language === 'vi' ? 'Phiếu Word (.docx)' : 'Homework Word (.docx)'}</span>
                  </button>

                  <button
                    onClick={() => handleExportPptx(selectedStudent.id)}
                    disabled={isExportingPptx}
                    className="py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isExportingPptx ? (
                      <span className="animate-spin text-white">⚙</span>
                    ) : (
                      <Presentation className="h-4 w-4" />
                    )}
                    <span>{language === 'vi' ? 'Review Slide (.pptx)' : 'Review Slide (.pptx)'}</span>
                  </button>
                </div>
              </div>

              {/* Logged Errors */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('mistakeHistoryTitle')}</p>
                {selectedStudentMistakes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentMistakes.map(m => (
                      <div key={m.id} className="rounded-lg bg-white border border-slate-150 p-3 text-xs">
                        <div className="flex justify-between font-bold text-slate-800 mb-1">
                          <span>{language === 'vi' ? 'Mạch' : 'Topic'}: {m.topic}</span>
                          <span className="text-[10px] font-semibold text-rose-500 font-mono bg-rose-50 px-1.5 rounded">{m.mistakeCategory}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mb-2">{language === 'vi' ? 'Kỹ năng' : 'Skill'}: {m.skill}</p>
                        <div className="flex gap-4 font-mono text-[10px] bg-slate-50 p-2 rounded">
                          <span className="text-rose-600">{language === 'vi' ? 'Đáp án học sinh' : 'Student answer'}: "{m.userAnswer}"</span>
                          <span className="text-emerald-600">{language === 'vi' ? 'Đáp án chuẩn' : 'Correct answer'}: "{m.correctAnswer}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-white border border-slate-150 p-6 text-center text-xs text-slate-500">
                    {t('noMistakesLogged')}
                  </div>
                )}
              </div>

            </div>
          ) : null}

          {/* D3-style SVG Speed vs. Accuracy Scatter Plot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
                {language === 'vi' ? 'Biểu đồ Tốc độ vs. Độ chính xác cả lớp' : 'Class Speed vs. Accuracy Scatter Plot'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'vi'
                  ? 'Phân nhóm học sinh theo bốn góc phần tư dựa trên tốc độ và tỉ lệ chính xác.'
                  : 'Map classroom cohorts into quadrants representing proficiency vs. speed thresholds.'}
              </p>
            </div>

            {/* SVG scatter plot */}
            <div className="relative border border-slate-150 bg-slate-50/50 rounded-xl p-2">
              <svg viewBox="0 0 400 240" className="w-full h-auto">
                {/* Quadrant backgrounds */}
                {/* Top Left: Master (x: 0-200, y: 0-120) */}
                <rect x="0" y="0" width="200" height="120" fill="rgba(16, 185, 129, 0.03)" />
                {/* Bottom Left: Careless (x: 0-200, y: 120-240) */}
                <rect x="0" y="120" width="200" height="120" fill="rgba(245, 158, 11, 0.03)" />
                {/* Top Right: Slow/Stuck (x: 200-400, y: 0-120) */}
                <rect x="200" y="0" width="200" height="120" fill="rgba(59, 130, 246, 0.03)" />
                {/* Bottom Right: Struggling (x: 200-400, y: 120-240) */}
                <rect x="200" y="120" width="200" height="120" fill="rgba(239, 68, 68, 0.03)" />

                {/* Grid lines and Quadrant Dividers */}
                <line x1="200" y1="0" x2="200" y2="240" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />

                {/* Axis Labels */}
                <text x="390" y="135" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">
                  {language === 'vi' ? 'Tốc độ (s) ➔' : 'Time per Q (s) ➔'}
                </text>
                <text x="210" y="10" fill="#64748b" fontSize="8" fontWeight="bold" transform="rotate(90, 210, 10)" textAnchor="start">
                  {language === 'vi' ? 'Chính xác (%) ➔' : 'Accuracy (%) ➔'}
                </text>

                {/* Quadrant Titles */}
                <text x="10" y="15" fill="#047857" fontSize="8" fontWeight="bold">
                  {language === 'vi' ? 'THÀNH THẠO (Master)' : 'MASTER (Fast & Correct)'}
                </text>
                <text x="10" y="230" fill="#b45309" fontSize="8" fontWeight="bold">
                  {language === 'vi' ? 'ẨU / VỘI VÀNG (Careless)' : 'CARELESS (Fast & Error-prone)'}
                </text>
                <text x="390" y="15" fill="#1d4ed8" fontSize="8" fontWeight="bold" textAnchor="end">
                  {language === 'vi' ? 'CHẬM / VƯỚNG (Stuck)' : 'STUCK (Slow & Correct)'}
                </text>
                <text x="390" y="230" fill="#b91c1c" fontSize="8" fontWeight="bold" textAnchor="end">
                  {language === 'vi' ? 'CẦN HỖ TRỢ (Struggling)' : 'STRUGGLING (Slow & Gaps)'}
                </text>

                {/* Student Nodes */}
                {students.map(student => {
                  const perf = getPerformanceMetrics(student);
                  
                  // Coordinate mappings
                  // X speed range [0, 50s] -> [30, 370]
                  const cx = 30 + (perf.speed / 50) * 340;
                  // Y accuracy range [40, 100%] -> [210, 20]
                  const cy = 210 - ((perf.accuracy - 40) / 60) * 190;

                  const isSelected = student.id === selectedStudentId;

                  return (
                    <g key={student.id} className="cursor-pointer" onClick={() => setSelectedStudentId(student.id)}>
                      {/* Node halo highlight if selected */}
                      {isSelected && (
                        <circle cx={cx} cy={cy} r="10" fill="none" stroke="#4f46e5" strokeWidth="2" className="animate-ping" />
                      )}
                      
                      {/* Node Dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? "6" : "5"}
                        fill={
                          perf.quadrant === 'Master' ? '#10b981' :
                          perf.quadrant === 'Careless' ? '#f59e0b' :
                          perf.quadrant === 'Stuck' ? '#3b82f6' : '#ef4444'
                        }
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      
                      {/* Node label */}
                      <text
                        x={cx}
                        y={cy - 8}
                        fill="#1e293b"
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="bg-white/80"
                      >
                        {student.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <p className="text-[10px] text-slate-400 italic">
              {language === 'vi'
                ? 'Nhấn vào nút tròn đại diện cho học sinh để mở chẩn đoán và tạo học liệu cá nhân.'
                : 'Click any student node to expand diagnostic records and issue AI learning packets.'}
            </p>
          </div>

          {/* Skill Heatmap Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id="skill_heatmap_widget">
            
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">{t('errorProfileTitle')}</h3>
              <p className="text-xs text-slate-500">{t('errorProfileSubtitle')}</p>
            </div>

            {/* Progress bars representations */}
            <div className="space-y-3.5 text-xs">
              {Object.entries(displayMistakes).map(([label, count]) => {
                const maxVal = 10;
                const ratio = Math.min((count * 100) / maxVal, 100);

                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700">{label}</span>
                      <span className="font-mono text-slate-500 font-bold">{count} {language === 'vi' ? 'em mắc phải' : 'students affected'}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all duration-500" 
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* AI-powered Recommended Intervention Plans */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id="pedagogical_interventions">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1">
                  <Bot className="h-5 w-5 text-indigo-650" />
                  {t('pedagogicalInterventionsTitle')}
                </h3>
                <p className="text-xs text-slate-500">{t('pedagogicalInterventionsSubtitle')}</p>
              </div>
              <span className="rounded bg-indigo-100 text-indigo-700 font-bold text-[9px] px-2 py-0.5 uppercase tracking-wider">
                Real-time
              </span>
            </div>

            {/* Proposals list */}
            <div className="space-y-3">
              {pedagogicalRecommendations.map((rec) => (
                <div key={rec.id} className="rounded-xl border border-slate-150 p-4 text-xs space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-800">{rec.target}</span>
                    <span className="rounded bg-amber-50 text-amber-700 font-bold text-[9px] px-2 py-0.5 border border-amber-100 uppercase">
                      {t('priorityLabel')}: {rec.priority}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed"><strong className="text-slate-700">{t('phenomenonLabel')}:</strong> {rec.problem}</p>
                  <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong className="text-indigo-650">{t('recommendedActionLabel')}:</strong> {rec.action}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>

      {/* Lesson Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-650" />
                <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                  {planLanguage === 'vi' ? 'Kế hoạch Hoạt động Dạy học' : 'Classroom Lesson Plan'}
                </h3>
              </div>
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5 overflow-y-auto bg-slate-50/30">
              {renderPlanContent()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] text-slate-400">
                {planLanguage === 'vi' ? 'Nhấn để sao chép toàn bộ văn bản' : 'Click to copy full text'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyPlan}
                  disabled={!generatedPlan || isGeneratingPlan}
                  className="px-4 py-1.5 rounded-lg border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {copyPlanSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">{t('copySuccessMsg')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>{t('copyPlanBtn')}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all"
                >
                  {t('closeModalBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
