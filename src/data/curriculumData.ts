/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Unit, Lesson, Question, QuestionDifficulty } from '../types';

export const DEMO_UNITS: Unit[] = [
  {
    id: 'unit_1',
    code: 'U1',
    title: {
      en: 'Unit 1: The number system',
      vi: 'Học phần 1: Hệ thống số'
    },
    description: {
      en: 'Understand decimal place values up to thousandths, multiplying/dividing by 10/100/1000, and rounding decimals.',
      vi: 'Hiểu giá trị hàng số thập phân đến hàng phần nghìn, nhân/chia với 10/100/1000, và làm tròn số thập phân.'
    }
  },
  {
    id: 'unit_4',
    code: 'U4',
    title: {
      en: 'Unit 4: Fractions and percentages',
      vi: 'Học phần 4: Phân số và tỉ số phần trăm'
    },
    description: {
      en: 'Deep dive into equivalent fractions, comparing fractions, and converting fractions to percentages.',
      vi: 'Hiểu sâu về phân số bằng nhau, so sánh phân số và chuyển đổi phân số sang tỉ số phần trăm.'
    }
  },
  {
    id: 'unit_11',
    code: 'U11',
    title: {
      en: 'Unit 11: Ratio and proportion',
      vi: 'Học phần 11: Tỉ số và tỉ lệ'
    },
    description: {
      en: 'Solve real-world problems using part-to-part ratios and direct proportion scaling.',
      vi: 'Giải quyết các bài toán thực tế bằng cách sử dụng tỉ số và tỉ lệ thuận.'
    }
  },
  {
    id: 'unit_16',
    code: 'U16',
    title: {
      en: 'Unit 16: Transformations and symmetry',
      vi: 'Học phần 16: Phép biến hình và đối xứng'
    },
    description: {
      en: 'Explore translation vectors, reflection axes, rotation degrees, and rotational symmetry.',
      vi: 'Khám phá vectơ tịnh tiến, trục đối xứng, góc quay và đối xứng quay hình học.'
    }
  }
];

export const DEMO_LESSONS: Lesson[] = [
  {
    id: 'lesson_1',
    unitId: 'unit_1',
    title: {
      en: 'Place value (Tenths, Hundredths, Thousandths)',
      vi: 'Giá trị theo hàng (Hàng phần mười, phần trăm, phần nghìn)'
    },
    code: 'L1',
    learningObjectives: ['6Npv.01 - Understand place value of decimal numbers up to 3 decimal places.', 'VSE.06.01 - Nhận biết giá trị chữ số thập phân đến hàng phần nghìn.'],
    explore: {
      scenario: {
        en: 'A standard digital scale weighs a small copper ring and displays 8.094 grams. What is the value of each digit?',
        vi: 'Một chiếc cân tiểu ly kỹ thuật số đo trọng lượng của một chiếc nhẫn đồng và hiển thị 8,094 gam. Giá trị của mỗi chữ số là gì?'
      },
      question: {
        en: 'What is the value of the digit 9 in this weight? How does it differ from 9 in a whole number?',
        vi: 'Chữ số 9 trong cân nặng này có giá trị là bao nhiêu? Nó khác thế nào với số 9 trong số tự nhiên?'
      },
      initialHint: {
        en: 'Look at the positions after the decimal point: tenths, hundredths, then thousandths.',
        vi: 'Hãy nhìn vào các vị trí sau dấu phẩy: hàng phần mười, hàng phần trăm, rồi hàng phần nghìn.'
      }
    },
    learn: {
      content: {
        en: `Each position after the decimal point represents a fraction of a whole:
        
- The **1st place** is the **tenths** ($1/10$ or $0.1$).
- The **2nd place** is the **hundredths** ($1/100$ or $0.01$).
- The **3rd place** is the **thousandths** ($1/1000$ or $0.001$).

*Example:* In **8.094**:
- $8$ represents $8$ ones ($8$).
- $0$ represents $0$ tenths ($0$).
- $9$ represents $9$ hundredths ($9/100$ or $0.09$).
- $4$ represents $4$ thousandths ($4/1000$ or $0.004$).`,
        vi: `Mỗi vị trí sau dấu phẩy biểu diễn một phần của đơn vị:
        
- **Vị trí thứ nhất** là hàng **phần mười** ($1/10$ hay $0,1$).
- **Vị trí thứ hai** là hàng **phần trăm** ($1/100$ hay $0,01$).
- **Vị trí thứ ba** là hàng **phần nghìn** ($1/1000$ hay $0,001$).

*Ví dụ:* Trong số **8,094**:
- $8$ chỉ $8$ đơn vị ($8$).
- $0$ chỉ $0$ phần mười ($0$).
- $9$ chỉ $9$ phần trăm ($9/100$ hay $0,09$).
- $4$ chỉ $4$ phần nghìn ($4/1000$ hay $0,004$).`
      },
      visualAidType: 'decimal-grid'
    },
    example: {
      problem: {
        en: 'Write the value of the digit 5 in 12.345',
        vi: 'Viết giá trị của chữ số 5 trong số 12,345'
      },
      steps: [
        {
          title: { en: 'Identify decimal places', vi: 'Xác định các chữ số thập phân' },
          description: { 
            en: 'The digits after the decimal point are 3 (tenths), 4 (hundredths), and 5 (thousandths).', 
            vi: 'Các chữ số sau dấu phẩy là 3 (phần mười), 4 (phần trăm), và 5 (phần nghìn).' 
          }
        },
        {
          title: { en: 'Determine the position of 5', vi: 'Xác định vị trí của 5' },
          description: {
            en: 'The digit 5 is in the third position after the decimal point, which is the thousandths place.',
            vi: 'Chữ số 5 ở vị trí thứ ba sau dấu phẩy, tức là hàng phần nghìn.'
          },
          mathExpression: '5 \\times \\frac{1}{1000} = 0.005'
        },
        {
          title: { en: 'Final Value', vi: 'Giá trị cuối cùng' },
          description: {
            en: 'The value of 5 is 5 thousandths (or 0.005).',
            vi: 'Giá trị của chữ số 5 là 5 phần nghìn (hay 0,005).'
          }
        }
      ]
    },
    reflection: {
      prompt: {
        en: 'Reflect on decimal place values:',
        vi: 'Suy nghĩ về giá trị vị trí thập phân:'
      },
      guidingQuestions: [
        {
          en: 'Why does a digit decrease in value by 10 times each time it moves one place to the right?',
          vi: 'Tại sao giá trị của một chữ số giảm đi 10 lần mỗi khi nó dịch sang phải một hàng?'
        },
        {
          en: 'How do you write "seventy-five thousandths" as a decimal?',
          vi: 'Em viết "bảy mươi lăm phần nghìn" dưới dạng số thập phân như thế nào?'
        }
      ]
    }
  },
  {
    id: 'lesson_2',
    unitId: 'unit_1',
    title: {
      en: 'Rounding Decimal Numbers',
      vi: 'Làm tròn số thập phân'
    },
    code: 'L2',
    learningObjectives: ['6Npv.02 - Round decimals to the nearest whole number or nearest tenth.', 'VSE.06.02 - Thực hiện làm tròn số thập phân đến phần mười hoặc số tự nhiên.'],
    explore: {
      scenario: {
        en: 'A running track is measured at 12.37 seconds. The timer screen rounds this value to display only one decimal place.',
        vi: 'Thời gian chạy được ghi nhận là 12,37 giây. Màn hình đồng hồ bấm giờ làm tròn giá trị này và chỉ hiển thị một chữ số thập phân.'
      },
      question: {
        en: 'What will the screen display? Why does it round up to 12.4 instead of down to 12.3?',
        vi: 'Màn hình sẽ hiển thị số nào? Tại sao nó làm tròn lên thành 12,4 thay vì làm tròn xuống 12,3?'
      },
      initialHint: {
        en: 'Look at the digit in the hundredths place (7). Is it closer to the next tenth or the current tenth?',
        vi: 'Hãy nhìn vào chữ số ở hàng phần trăm (7). Nó gần với hàng phần mười tiếp theo hay hàng phần mười hiện tại?'
      }
    },
    learn: {
      content: {
        en: `To round a decimal number:
        
1. **Identify the place value** you are rounding to (e.g., nearest tenth).
2. **Look at the next digit to the right** (e.g., the hundredths place).
3. **Apply the rounding rule**:
   - If that digit is **5 or more**, **round UP** (add 1 to the target digit).
   - If that digit is **less than 5**, **round DOWN** (keep the target digit unchanged).
4. Drop all digits to the right of the rounded position.

*Example:* Round **4.53** and **4.58** to the nearest tenth:
- For **4.53**: The next digit is 3 (less than 5), so round down to **4.5**.
- For **4.58**: The next digit is 8 (5 or more), so round up to **4.6** ($5+1=6$).`,
        vi: `Quy tắc làm tròn số thập phân:
        
1. **Xác định hàng cần làm tròn** (ví dụ: làm tròn đến hàng phần mười).
2. **Nhìn vào chữ số ngay bên phải** hàng đó (ví dụ: hàng phần trăm).
3. **Áp dụng quy tắc làm tròn**:
   - Nếu chữ số đó **từ 5 trở lên**, **làm tròn LÊN** (cộng thêm 1 vào hàng cần làm tròn).
   - Nếu chữ số đó **nhỏ hơn 5**, **làm tròn XUỐNG** (giữ nguyên hàng cần làm tròn).
4. Bỏ các chữ số đứng sau hàng đã làm tròn.

*Ví dụ:* Làm tròn **4,53** và **4,58** đến hàng phần mười:
- Với **4,53**: Chữ số tiếp theo là 3 (nhỏ hơn 5), làm tròn xuống thành **4,5**.
- With **4,58**: Chữ số tiếp theo là 8 (lớn hơn 5), làm tròn lên thành **4,6**.`
      },
      visualAidType: 'none'
    },
    example: {
      problem: {
        en: 'Round 18.75 to the nearest whole number.',
        vi: 'Làm tròn số 18,75 đến số tự nhiên gần nhất.'
      },
      steps: [
        {
          title: { en: 'Identify target digit', vi: 'Xác định hàng cần làm tròn' },
          description: {
            en: 'The target digit is 8 (the ones place).',
            vi: 'Chữ số ở hàng đơn vị (hàng cần làm tròn) là 8.'
          }
        },
        {
          title: { en: 'Check the next digit', vi: 'Kiểm tra chữ số tiếp theo' },
          description: {
            en: 'The digit to the right of 8 is 7 (in the tenths place). Since 7 is 5 or more, we round up.',
            vi: 'Chữ số ngay bên phải 8 là 7 (hàng phần mười). Vì 7 từ 5 trở lên, ta làm tròn lên.'
          },
          mathExpression: '18.75 \\rightarrow 19'
        },
        {
          title: { en: 'State the final answer', vi: 'Kết quả cuối cùng' },
          description: {
            en: 'So, 18.75 rounded to the nearest whole number is 19.',
            vi: 'Như vậy, 18,75 làm tròn đến số tự nhiên gần nhất là 19.'
          }
        }
      ]
    },
    reflection: {
      prompt: {
        en: 'Reflect on rounding decimals:',
        vi: 'Suy nghĩ về làm tròn số thập phân:'
      },
      guidingQuestions: [
        {
          en: 'What happens when you round 0.96 to the nearest tenth? How does the carry-over affect the units place?',
          vi: 'Điều gì xảy ra khi làm tròn 0,96 đến hàng phần mười? Phép nhớ ảnh hưởng thế nào đến hàng đơn vị?'
        },
        {
          en: 'Is a rounded number exact, or is it an estimation?',
          vi: 'Số đã làm tròn là số chính xác hay số ước lượng?'
        }
      ]
    }
  },
  {
    id: 'lesson_3',
    unitId: 'unit_4',
    title: {
      en: 'Understanding and Comparing Fractions',
      vi: 'Hiểu và so sánh phân số'
    },
    code: 'L3',
    learningObjectives: ['6Fr.01 - Find equivalent fractions and compare fractions with different denominators.', 'VSE.06.03 - Tìm phân số bằng nhau và so sánh phân số khác mẫu số.'],
    explore: {
      scenario: {
        en: 'Chloe and Minh have two identical large pizzas. Chloe cuts hers into 12 slices and eats 8. Minh cuts his into 3 slices and eats 2.',
        vi: 'Chloe và Minh có hai chiếc bánh pizza lớn giống hệt nhau. Chloe cắt bánh của mình thành 12 phần và ăn 8 phần. Minh cắt bánh thành 3 phần và ăn 2 phần.'
      },
      question: {
        en: 'Who ate more pizza? Can we represent their portions with a common denominator?',
        vi: 'Ai ăn nhiều bánh hơn? Chúng ta có thể biểu diễn phần ăn của họ bằng một mẫu số chung không?'
      },
      initialHint: {
        en: 'Divide both numerator and denominator of 8/12 by their Greatest Common Factor.',
        vi: 'Chia cả tử số và mẫu số của 8/12 cho Ước chung lớn nhất của chúng.'
      }
    },
    learn: {
      content: {
        en: `To compare fractions with different denominators:
        
1. **Find a common denominator** (usually the Least Common Multiple of the denominators).
2. **Convert** each fraction to an equivalent fraction with this common denominator.
3. **Compare the numerators**: The fraction with the larger numerator is the larger fraction.

*Example:* Compare $2/3$ and $5/8$:
- The LCM of 3 and 8 is **24**.
- Convert: $\\frac{2 \\times 8}{3 \\times 8} = \\frac{16}{24}$
- Convert: $\\frac{5 \\times 3}{8 \\times 3} = \\frac{15}{24}$
- Compare: $\\frac{16}{24} > \\frac{15}{24}$, so $2/3 > 5/8$.`,
        vi: `Để so sánh các phân số khác mẫu số:
        
1. **Tìm mẫu số chung** (thường là Bội chung nhỏ nhất của các mẫu số).
2. **Quy đồng** mỗi phân số về mẫu số chung này.
3. **So sánh các tử số**: Phân số nào có tử số lớn hơn thì lớn hơn.

*Ví dụ:* So sánh $2/3$ và $5/8$:
- BCNN của 3 và 8 là **24**.
- Quy đồng: $\\frac{2 \\times 8}{3 \\times 8} = \\frac{16}{24}$
- Quy đồng: $\\frac{5 \\times 3}{8 \\times 3} = \\frac{15}{24}$
- So sánh: $\\frac{16}{24} > \\frac{15}{24}$ nên $2/3 > 5/8$.`
      },
      visualAidType: 'fraction-bar'
    },
    example: {
      problem: {
        en: 'Compare 3/4 and 5/6.',
        vi: 'So sánh 3/4 và 5/6.'
      },
      steps: [
        {
          title: { en: 'Find GCF and common denominator', vi: 'Tìm mẫu số chung' },
          description: {
            en: 'The denominators are 4 and 6. The Least Common Multiple of 4 and 6 is 12.',
            vi: 'Mẫu số là 4 và 6. Bội chung nhỏ nhất của 4 và 6 là 12.'
          }
        },
        {
          title: { en: 'Convert fractions', vi: 'Quy đồng phân số' },
          description: {
            en: 'Multiply 3/4 by 3/3, and 5/6 by 2/2.',
            vi: 'Quy đồng 3/4 bằng cách nhân cả tử và mẫu với 3, và 5/6 nhân cả tử và mẫu với 2.'
          },
          mathExpression: '\\frac{3 \\times 3}{4 \\times 3} = \\frac{9}{12}, \\quad \\frac{5 \\times 2}{6 \\times 2} = \\frac{10}{12}'
        },
        {
          title: { en: 'Compare results', vi: 'So sánh kết quả' },
          description: {
            en: 'Since 10/12 is larger than 9/12, 5/6 is larger than 3/4.',
            vi: 'Vì 10/12 lớn hơn 9/12, nên 5/6 lớn hơn 3/4.'
          },
          mathExpression: '\\frac{5}{6} > \\frac{3}{4}'
        }
      ]
    },
    reflection: {
      prompt: {
        en: 'Reflect on fractions:',
        vi: 'Suy nghĩ về phân số:'
      },
      guidingQuestions: [
        {
          en: 'Why does multiplying the top and bottom of a fraction by the same number keep its value unchanged?',
          vi: 'Tại sao khi ta nhân cả tử số và mẫu số của một phân số với cùng một số thì giá trị của nó không đổi?'
        },
        {
          en: 'Can you think of a quick way to compare two fractions with the same numerator (e.g. 3/7 vs 3/8)?',
          vi: 'Em có thể nghĩ ra cách nhanh để so sánh hai phân số có cùng tử số (ví dụ: 3/7 và 3/8) không?'
        }
      ]
    }
  },
  {
    id: 'lesson_4',
    unitId: 'unit_4',
    title: {
      en: 'Percentages of Quantities',
      vi: 'Tỉ số phần trăm của một lượng'
    },
    code: 'L4',
    learningObjectives: ['6Fr.02 - Calculate simple percentages of quantities (e.g., 10%, 25%, 50%, 75%).', 'VSE.06.04 - Tính tỉ số phần trăm của một đại lượng hoặc số lượng.'],
    explore: {
      scenario: {
        en: 'A shop sells a bicycle for $120. During a summer sale, they offer a 25% discount.',
        vi: 'Một cửa hàng bán chiếc xe đạp với giá $120. Trong đợt giảm giá mùa hè, họ giảm giá 25%.'
      },
      question: {
        en: 'How much money do you save? What is the new sale price of the bicycle?',
        vi: 'Em tiết kiệm được bao nhiêu tiền? Giá mới của chiếc xe đạp sau khi giảm giá là bao nhiêu?'
      },
      initialHint: {
        en: '25% is equivalent to the fraction 1/4. You can find 25% by dividing the amount by 4.',
        vi: '25% tương đương với phân số 1/4. Em có thể tìm 25% bằng cách chia số tiền đó cho 4.'
      }
    },
    learn: {
      content: {
        en: `**Percentage** means "out of 100". Useful benchmarks:
        
- **50%** is half ($1/2$). Divide by 2.
- **25%** is one quarter ($1/4$). Divide by 4 (or half of 50%).
- **10%** is one tenth ($1/10$). Divide by 10.
- **75%** is three quarters ($3/4$). Find 25% and multiply by 3 (or subtract 25% from 100%).

*Example:* Calculate **10%** and **25%** of **$80**:
- **10% of $80** = $80 / 10 = **$8**.
- **25% of $80** = $80 / 4 = **$20** (or 50% = $40, half is $20).`,
        vi: `**Tỉ số phần trăm** nghĩa là "trên 100". Các tỷ lệ mốc cần nhớ:
        
- **50%** là một nửa ($1/2$). Chia cho 2.
- **25%** là một phần tư ($1/4$). Chia cho 4 (hoặc lấy một nửa của 50%).
- **10%** là một phần mười ($1/10$). Chia cho 10.
- **75%** là ba phần tư ($3/4$). Tìm 25% rồi nhân với 3 (hoặc lấy 100% trừ đi 25%).

*Ví dụ:* Tính **10%** và **25%** của **$80**:
- **10% của $80** = $80 / 10 = **$8**.
- **25% của $80** = $80 / 4 = **$20**.`
      },
      visualAidType: 'percentage-circle'
    },
    example: {
      problem: {
        en: 'Find 75% of 60 meters.',
        vi: 'Tìm 75% của 60 mét.'
      },
      steps: [
        {
          title: { en: 'Find 25% first', vi: 'Tìm 25% trước' },
          description: {
            en: 'Since 25% is 1/4, divide 60 by 4.',
            vi: 'Vì 25% là 1/4, ta lấy 60 chia cho 4.'
          },
          mathExpression: '60 \\div 4 = 15 \\text{ meters}'
        },
        {
          title: { en: 'Multiply to find 75%', vi: 'Nhân lên để tìm 75%' },
          description: {
            en: '75% is 3 times 25%. Multiply the result by 3.',
            vi: '75% gấp 3 lần 25%. Nhân kết quả vừa tìm được với 3.'
          },
          mathExpression: '15 \\times 3 = 45 \\text{ meters}'
        },
        {
          title: { en: 'State final answer', vi: 'Kết quả cuối cùng' },
          description: {
            en: 'So, 75% of 60 meters is 45 meters.',
            vi: 'Như vậy, 75% của 60 mét là 45 mét.'
          }
        }
      ]
    },
    reflection: {
      prompt: {
        en: 'Reflect on percentages:',
        vi: 'Suy nghĩ về tỉ số phần trăm:'
      },
      guidingQuestions: [
        {
          en: 'Why is finding 10% of a number a helpful starting point for finding other percentages like 20% or 5%?',
          vi: 'Tại sao việc tìm 10% của một số lại là điểm bắt đầu hữu ích để tìm các tỷ lệ khác như 20% hay 5%?'
        },
        {
          en: 'Can 150% of a quantity exist? Explain with a drawing or example.',
          vi: 'Có tồn tại 150% của một lượng không? Giải thích bằng hình vẽ hoặc ví dụ.'
        }
      ]
    }
  },
  {
    id: 'lesson_5',
    unitId: 'unit_11',
    title: {
      en: 'Ratio and Direct Proportion',
      vi: 'Tỉ số và tỉ lệ thuận'
    },
    code: 'L5',
    learningObjectives: ['6Rt.01 - Solve direct proportion problems by scaling quantities up or down.', 'VSE.06.05 - Giải bài toán tỉ lệ thuận bằng cách nhân hoặc chia tỉ lệ tương ứng.'],
    explore: {
      scenario: {
        en: 'To make 4 pancakes, a chef needs 200 grams of flour. Chloe wants to make exactly 12 pancakes for her birthday party.',
        vi: 'Để làm được 4 chiếc bánh kếp, đầu bếp cần 200 gam bột mì. Chloe muốn làm đúng 12 chiếc bánh kếp cho bữa tiệc sinh nhật của mình.'
      },
      question: {
        en: 'How much flour does Chloe need? How does the flour scale with the number of pancakes?',
        vi: 'Chloe cần bao nhiêu bột mì? Lượng bột mì thay đổi tỉ lệ thuận với số lượng bánh như thế nào?'
      },
      initialHint: {
        en: 'Find the scale factor: How many times larger is 12 pancakes than 4 pancakes?',
        vi: 'Tìm hệ số tỉ lệ: 12 chiếc bánh kếp lớn gấp mấy lần so với 4 chiếc bánh kếp?'
      }
    },
    learn: {
      content: {
        en: `**Direct Proportion (Tỉ lệ thuận)** means that as one quantity increases, the other increases at the same rate.
        
**How to solve:**
1. **Find the scale factor:** Divide the target quantity by the starting quantity.
2. **Apply the scale factor:** Multiply the other quantity by this factor.
3. *Alternative (Unitary Method):* Find the amount for **one** item first, then multiply by the target number.

*Example:* If 5 notebooks cost $15, how much do 8 notebooks cost?
- Scale factor: $8 / 5 = 1.6$
- Unitary method: 1 notebook costs $15 / 5 = $3.
- Therefore, 8 notebooks cost: $3 \\times 8 = **$24** (Correct!).`,
        vi: `**Tỉ lệ thuận** nghĩa là khi một đại lượng tăng lên bao nhiêu lần thì đại lượng kia cũng tăng lên bấy nhiêu lần.
        
**Cách giải:**
1. **Tìm hệ số tỉ lệ:** Lấy lượng mục tiêu chia cho lượng ban đầu.
2. **Áp dụng hệ số tỉ lệ:** Nhân lượng còn lại với hệ số này.
3. *Cách khác (Phương pháp rút về đơn vị):* Tìm lượng tương ứng với **1** đơn vị, rồi nhân với số đơn vị mục tiêu.

*Ví dụ:* Nếu 5 quyển vở có giá $15, thì 8 quyển vở giá bao nhiêu?
- Phương pháp rút về đơn vị: 1 quyển vở có giá $15 / 5 = $3.
- Vậy, 8 quyển vở có giá: $3 \\times 8 = **$24**.`
      },
      visualAidType: 'none'
    },
    example: {
      problem: {
        en: 'A car travels 150 km on 10 liters of petrol. How far can it travel on 30 liters of petrol?',
        vi: 'Một chiếc ô tô đi được 150 km tiêu hao 10 lít xăng. Hỏi nó có thể đi được bao xa với 30 lít xăng?'
      },
      steps: [
        {
          title: { en: 'Find the scale factor', vi: 'Tìm hệ số tỉ lệ' },
          description: {
            en: 'Divide the new petrol amount by the old amount.',
            vi: 'Chia lượng xăng mới cho lượng xăng cũ.'
          },
          mathExpression: '30 \\div 10 = 3'
        },
        {
          title: { en: 'Multiply distance', vi: 'Nhân quãng đường tương ứng' },
          description: {
            en: 'Multiply the original distance (150 km) by the scale factor (3).',
            vi: 'Nhân quãng đường ban đầu (150 km) với hệ số tỉ lệ (3).'
          },
          mathExpression: '150 \\times 3 = 450 \\text{ km}'
        },
        {
          title: { en: 'State final answer', vi: 'Kết quả cuối cùng' },
          description: {
            en: 'The car can travel 450 km on 30 liters of petrol.',
            vi: 'Ô tô có thể đi được 450 km với 30 lít xăng.'
          }
        }
      ]
    },
    reflection: {
      prompt: {
        en: 'Reflect on proportion:',
        vi: 'Suy nghĩ về tỉ lệ thuận:'
      },
      guidingQuestions: [
        {
          en: 'How is direct proportion different from sharing in a fixed ratio?',
          vi: 'Tỉ lệ thuận khác thế nào với chia một lượng theo một tỉ số cố định?'
        },
        {
          en: 'If it takes 2 bakers 3 hours to bake a cake, does it take 4 bakers 6 hours? Why is this NOT direct proportion?',
          vi: 'Nếu 2 thợ làm bánh mất 3 giờ để làm xong chiếc bánh, có phải 4 thợ sẽ mất 6 giờ không? Tại sao đây KHÔNG PHẢI tỉ lệ thuận?'
        }
      ]
    }
  },
  {
    id: 'lesson_6',
    unitId: 'unit_16',
    title: {
      en: 'Coordinate Transformations',
      vi: 'Biến đổi Tọa độ Hình học'
    },
    code: 'L6',
    learningObjectives: ['6Gg.01 - Translate, reflect, and rotate shapes on a coordinate grid.', 'VSE.06.16 - Thực hiện tịnh tiến, đối xứng, và quay đa giác trên lưới tọa độ.'],
    explore: {
      scenario: {
        en: 'A robotic arm moves a triangular part on a grid from position A(1,1) to A\'(3,4). How do the coordinates change?',
        vi: 'Một cánh tay robot di chuyển một chi tiết hình tam giác trên lưới từ vị trí A(1,1) sang A\'(3,4). Các tọa độ thay đổi như thế nào?'
      },
      question: {
        en: 'Can you write the transformation as a translation vector? How do you calculate the shift?',
        vi: 'Bạn có thể viết phép biến đổi này dưới dạng vectơ tịnh tiến không? Cách tính độ dịch chuyển là gì?'
      },
      initialHint: {
        en: 'Subtract the original x and y coordinates from the new coordinates.',
        vi: 'Trừ tọa độ x và y ban đầu khỏi tọa độ mới để tìm độ dịch.'
      }
    },
    learn: {
      content: {
        en: `Geometry transformations change a shape's position, orientation, or size:
        
- **Translation (Phép tịnh tiến):** Slides a shape along a vector $(dx, dy)$. Every point $(x, y)$ moves to $(x+dx, y+dy)$.
- **Reflection (Phép đối xứng):** Flips a shape across an axis. Across x-axis: $(x,y) \\rightarrow (x,-y)$. Across y-axis: $(x,y) \\rightarrow (-x,y)$.
- **Rotation (Phép quay):** Turns a shape around a center (origin). A $90^\\circ$ counterclockwise rotation maps $(x,y) \\rightarrow (-y,x)$.`,
        vi: `Các phép biến hình hình học thay đổi vị trí, hướng hoặc kích thước của một hình:
        
- **Phép tịnh tiến:** Trượt một hình dọc theo vectơ $(dx, dy)$. Mọi điểm $(x, y)$ chuyển thành $(x+dx, y+dy)$.
- **Phép đối xứng:** Lật một hình qua một trục. Qua trục hoành x: $(x,y) \\rightarrow (x,-y)$. Qua trục tung y: $(x,y) \\rightarrow (-x,y)$.
- **Phép quay:** Xoay một hình quanh tâm (gốc tọa độ). Phép quay $90^\\circ$ ngược chiều kim đồng hồ biến $(x,y) \\rightarrow (-y,x)$.`
      },
      visualAidType: 'transform-sandbox'
    },
    example: {
      problem: {
        en: 'Translate triangle ABC with vertices A(1,1), B(3,1), C(2,3) by vector (2, -1). Find the new vertices.',
        vi: 'Tịnh tiến tam giác ABC có các đỉnh A(1,1), B(3,1), C(2,3) theo vectơ (2, -1). Tìm các đỉnh mới.'
      },
      steps: [
        {
          title: { en: 'Apply formula', vi: 'Áp dụng công thức tịnh tiến' },
          description: { 
            en: 'For each point (x, y), add 2 to x and subtract 1 from y: (x\', y\') = (x + 2, y - 1).', 
            vi: 'Với mỗi điểm (x, y), cộng 2 vào x và trừ 1 ở y: (x\', y\') = (x + 2, y - 1).' 
          }
        },
        {
          title: { en: 'Calculate coordinates', vi: 'Tính toán tọa độ' },
          description: {
            en: 'A\' = (1+2, 1-1) = (3,0); B\' = (3+2, 1-1) = (5,0); C\' = (2+2, 3-1) = (4,2).',
            vi: 'A\' = (1+2, 1-1) = (3,0); B\' = (3+2, 1-1) = (5,0); C\' = (2+2, 3-1) = (4,2).'
          },
          mathExpression: '(x\', y\') = (x + 2, y - 1)'
        },
        {
          title: { en: 'Final Position', vi: 'Vị trí cuối cùng' },
          description: {
            en: 'The new vertices of the translated triangle are A\'(3,0), B\'(5,0), and C\'(4,2).',
            vi: 'Các đỉnh mới của tam giác tịnh tiến là A\'(3,0), B\'(5,0), và C\'(4,2).'
          }
        }
      ]
    },
    reflection: {
      prompt: {
        en: 'Reflect on coordinate transformations:',
        vi: 'Suy nghĩ về các phép biến hình tọa độ:'
      },
      guidingQuestions: [
        {
          en: 'Why do coordinates change their signs under reflection across coordinate axes?',
          vi: 'Tại sao các tọa độ thay đổi dấu của chúng khi đối xứng qua các trục tọa độ?'
        },
        {
          en: 'How can you describe a rotation of 180 degrees using translations or reflections?',
          vi: 'Làm thế nào em có thể mô tả một phép quay 180 độ bằng các phép tịnh tiến hoặc đối xứng?'
        }
      ]
    }
  },
  {
    id: 'lesson_7',
    unitId: 'unit_16',
    title: {
      en: 'Rotational Symmetry',
      vi: 'Đối xứng Quay Hình học'
    },
    code: 'L7',
    learningObjectives: ['6Gs.02 - Identify rotational symmetry and its order in 2D shapes.', 'VSE.06.17 - Xác định đối xứng quay và bậc đối xứng quay của hình phẳng.'],
    explore: {
      scenario: {
        en: 'Look at a standard windmill or starfish. When you rotate it, it looks exactly the same multiple times before making a full turn.',
        vi: 'Hãy quan sát một chiếc chong chóng hoặc con sao biển. Khi bạn xoay nó, nó trông giống hệt như cũ nhiều lần trước khi hoàn thành một vòng quay.'
      },
      question: {
        en: 'How many times does a square look identical to itself as you rotate it 360 degrees?',
        vi: 'Một hình vuông trông giống hệt chính nó bao nhiêu lần khi bạn xoay nó đủ 360 độ?'
      },
      initialHint: {
        en: 'Think about rotating it by 90 degrees, 180 degrees, 270 degrees, and 360 degrees.',
        vi: 'Hãy nghĩ về việc xoay nó 90 độ, 180 độ, 270 độ, và 360 độ.'
      }
    },
    learn: {
      content: {
        en: `Rotational symmetry exists when a shape looks the same after a partial rotation:
        
- **Order of Rotational Symmetry (Bậc đối xứng quay):** The number of times a shape fits onto itself in a full $360^\\circ$ turn.
- *Examples:*
  - A **Rectangle** has order **2** ($180^\\circ, 360^\\circ$).
  - An **Equilateral Triangle** has order **3** ($120^\\circ, 240^\\circ, 360^\\circ$).
  - A **Square** has order **4** ($90^\\circ, 180^\\circ, 270^\\circ, 360^\\circ$).`,
        vi: `Đối xứng quay tồn tại khi một hình trông giống như cũ sau một phần của vòng quay:
        
- **Bậc đối xứng quay:** Số lần hình đó trùng khớp với chính nó trong một vòng quay đầy đủ $360^\\circ$.
- *Ví dụ:*
  - **Hình chữ nhật** có bậc đối xứng **2** ($180^\\circ, 360^\\circ$).
  - **Tam giác đều** có bậc đối xứng **3** ($120^\\circ, 240^\\circ, 360^\\circ$).
  - **Hình vuông** có bậc đối xứng **4** ($90^\\circ, 180^\\circ, 270^\\circ, 360^\\circ$).`
      },
      visualAidType: 'symmetry-playground'
    },
    example: {
      problem: {
        en: 'Determine the order of rotational symmetry of a regular pentagon.',
        vi: 'Xác định bậc đối xứng quay của một ngũ giác đều.'
      },
      steps: [
        {
          title: { en: 'Identify number of sides', vi: 'Xác định số cạnh' },
          description: { 
            en: 'A regular pentagon has 5 equal sides and 5 equal angles.', 
            vi: 'Một ngũ giác đều có 5 cạnh bằng nhau và 5 góc bằng nhau.' 
          }
        },
        {
          title: { en: 'Calculate angle of rotation', vi: 'Tính góc xoay tối thiểu' },
          description: {
            en: 'Divide 360 by 5: 360 / 5 = 72 degrees. The shape looks identical every 72 degrees rotation.',
            vi: 'Chia 360 cho 5: 360 / 5 = 72 độ. Hình sẽ giống hệt sau mỗi lần xoay 72 độ.'
          },
          mathExpression: '360^\\circ / 5 = 72^\\circ'
        },
        {
          title: { en: 'State the Order', vi: 'Kết luận bậc đối xứng' },
          description: {
            en: 'Since it fits onto itself 5 times in a full turn, the order is 5.',
            vi: 'Vì nó trùng khớp với chính nó 5 lần trong một vòng quay đầy đủ, bậc đối xứng quay là 5.'
          }
        }
      ]
    },
    reflection: {
      prompt: {
        en: 'Reflect on rotational symmetry:',
        vi: 'Suy nghĩ về đối xứng quay:'
      },
      guidingQuestions: [
        {
          en: 'Does every shape have at least rotational symmetry of order 1? Why?',
          vi: 'Có phải mọi hình đều có bậc đối xứng quay ít nhất là 1 không? Tại sao?'
        },
        {
          en: 'How does line symmetry differ from rotational symmetry in a regular shape?',
          vi: 'Đối xứng trục khác với đối xứng quay thế nào trong một hình đều?'
        }
      ]
    }
  }
];

export const DEMO_QUESTIONS: Question[] = [
  // LESSON 1 QUESTIONS: Place value
  {
    id: 'q1',
    lessonId: 'lesson_1',
    unitId: 'unit_1',
    topic: 'Place Value',
    skill: 'Identify digit value up to thousandths',
    difficulty: QuestionDifficulty.EASY,
    questionText: {
      en: 'What is the value of the digit 9 in the decimal number 809.46? (Write as a whole number)',
      vi: 'Chữ số 9 trong số thập phân 809,46 có giá trị là bao nhiêu? (Viết dưới dạng số tự nhiên)'
    },
    type: 'numeric',
    correctAnswer: '9',
    solution: {
      en: 'In 809.46, the digit 9 is in the ones place, so its value is 9.',
      vi: 'Trong số 809,46, chữ số 9 ở hàng đơn vị, do đó giá trị của nó là 9.'
    },
    hint: {
      en: 'Look at the digit just to the left of the decimal point.',
      vi: 'Hãy nhìn vào chữ số nằm ngay bên trái dấu phẩy.'
    },
    explanation: {
      en: 'The place value columns are: Hundreds (8), Tens (0), Ones (9), Tenths (4), Hundredths (6).',
      vi: 'Các hàng giá trị là: Hàng trăm (8), Hàng chục (0), Hàng đơn vị (9), Hàng phần mười (4), Hàng phần trăm (6).'
    },
    commonMistake: {
      en: '0.9 or 90 (confusing it with tenths or tens place).',
      vi: '0,9 hoặc 90 (nhầm lẫn với hàng phần mười hoặc hàng chục).'
    },
    thinkingSkill: 'Characterising'
  },
  {
    id: 'q2',
    lessonId: 'lesson_1',
    unitId: 'unit_1',
    topic: 'Place Value',
    skill: 'Identify thousandths digit value',
    difficulty: QuestionDifficulty.MEDIUM,
    questionText: {
      en: 'What is the value of the digit 4 in the decimal number 8.094? (Write as a fraction like a/b, e.g. 4/1000)',
      vi: 'Chữ số 4 trong số thập phân 8,094 có giá trị là phân số nào? (Viết dưới dạng a/b, ví dụ 4/1000)'
    },
    type: 'text-input',
    correctAnswer: '4/1000',
    solution: {
      en: 'In 8.094, the digit 4 is in the third position after the decimal point, which is the thousandths place. So its value is 4/1000 (or 0.004).',
      vi: 'Trong số 8,094, chữ số 4 ở vị trí thứ ba sau dấu phẩy, tức là hàng phần nghìn. Do đó giá trị của nó là 4/1000 (hay 0,004).'
    },
    hint: {
      en: 'Count the decimal places: 0 is tenths, 9 is hundredths, 4 is thousandths.',
      vi: 'Đếm các chữ số thập phân: 0 là phần mười, 9 là phần trăm, 4 là phần nghìn.'
    },
    explanation: {
      en: 'Since the digit 4 is in the third decimal place, it represents 4 parts out of 1000.',
      vi: 'Vì chữ số 4 nằm ở hàng thập phân thứ ba, nó biểu diễn 4 phần trên 1000.'
    },
    commonMistake: {
      en: '4/100 or 4/10 (confusing hundredths/tenths with thousandths).',
      vi: '4/100 hoặc 4/10 (nhầm lẫn hàng phần trăm/phần mười với phần nghìn).'
    },
    thinkingSkill: 'Specialising'
  },
  {
    id: 'q3',
    lessonId: 'lesson_1',
    unitId: 'unit_1',
    topic: 'Place Value',
    skill: 'Compose expanded decimal forms',
    difficulty: QuestionDifficulty.HARD,
    questionText: {
      en: 'Express the sum as a single decimal number: 500 + 7 + 0.02 + 0.006',
      vi: 'Viết tổng sau dưới dạng một số thập phân duy nhất: 500 + 7 + 0,02 + 0,006'
    },
    type: 'numeric',
    correctAnswer: '507.026',
    solution: {
      en: 'Combine the parts: 500 (hundreds), 7 (ones), 0 tenths, 2 hundredths, and 6 thousandths gives 507.026.',
      vi: 'Gộp các phần: 500 (trăm), 7 (đơn vị), 0 phần mười, 2 phần trăm, và 6 phần nghìn được 507,026.'
    },
    hint: {
      en: 'Be careful with the tens place and tenths place - both are zero!',
      vi: 'Hãy cẩn thận với hàng chục và hàng phần mười - cả hai đều bằng không!'
    },
    explanation: {
      en: '500 + 7 = 507. The decimal parts are 0 tenths, 2 hundredths, and 6 thousandths, which is .026. Combined: 507.026.',
      vi: '500 + 7 = 507. Phần thập phân có 0 phần mười, 2 phần trăm, và 6 phần nghìn, tức là ,026. Kết quả: 507,026.'
    },
    commonMistake: {
      en: '507.26 (dropping the placeholder zero in the tenths place).',
      vi: '507,26 (bỏ quên số 0 giữ chỗ ở hàng phần mười).'
    },
    thinkingSkill: 'Generalising'
  },

  // LESSON 2 QUESTIONS: Rounding decimals
  {
    id: 'q4',
    lessonId: 'lesson_2',
    unitId: 'unit_1',
    topic: 'Rounding Decimals',
    skill: 'Round to nearest tenth',
    difficulty: QuestionDifficulty.EASY,
    questionText: {
      en: 'Round 12.37 to the nearest tenth.',
      vi: 'Làm tròn số 12,37 đến hàng phần mười gần nhất.'
    },
    type: 'numeric',
    correctAnswer: '12.4',
    solution: {
      en: 'The digit in the hundredths place is 7. Since 7 is 5 or more, we round up 12.3 to 12.4.',
      vi: 'Chữ số ở hàng phần trăm là 7. Vì 7 từ 5 trở lên, ta làm tròn lên 12,3 thành 12,4.'
    },
    hint: {
      en: 'Look at the digit after 3. It is 7, which is larger than 5, so round up.',
      vi: 'Hãy nhìn chữ số đứng sau số 3. Đó là số 7, lớn hơn 5, do đó làm tròn lên.'
    },
    explanation: {
      en: 'When rounding to the tenths place, check the hundredths place. Since 7 >= 5, add 1 to the tenths place (3 + 1 = 4).',
      vi: 'Khi làm tròn đến hàng phần mười, ta kiểm tra hàng phần trăm. Vì 7 >= 5, ta cộng 1 vào hàng phần mười (3 + 1 = 4).'
    },
    commonMistake: {
      en: '12.3 (rounding down instead of up).',
      vi: '12,3 (làm tròn xuống thay vì lên).'
    },
    thinkingSkill: 'Specialising'
  },
  {
    id: 'q5',
    lessonId: 'lesson_2',
    unitId: 'unit_1',
    topic: 'Rounding Decimals',
    skill: 'Round to nearest whole number',
    difficulty: QuestionDifficulty.MEDIUM,
    questionText: {
      en: 'Round 18.75 to the nearest whole number.',
      vi: 'Làm tròn số 18,75 đến số tự nhiên gần nhất.'
    },
    type: 'numeric',
    correctAnswer: '19',
    solution: {
      en: 'The tenths digit is 7. Since 7 is 5 or more, we round up 18 to 19.',
      vi: 'Chữ số hàng phần mười là 7. Vì 7 từ 5 trở lên, ta làm tròn lên 18 thành 19.'
    },
    hint: {
      en: 'Check the tenths digit (7). Does it tell you to round 18 up or down?',
      vi: 'Kiểm tra chữ số hàng phần mười (7). Nó bảo em làm tròn 18 lên hay xuống?'
    },
    explanation: {
      en: 'The first digit after the decimal is 7, which triggers a round up of the units digit 8 to 9.',
      vi: 'Chữ số đầu tiên sau dấu phẩy là 7, do đó ta làm tròn tăng chữ số hàng đơn vị từ 8 lên 9.'
    },
    commonMistake: {
      en: '18 (rounding down) or 20 (rounding to the nearest ten instead of the nearest whole number).',
      vi: '18 (làm tròn xuống) hoặc 20 (làm tròn đến hàng chục thay vì số tự nhiên).'
    },
    thinkingSkill: 'Classifying'
  },
  {
    id: 'q6',
    lessonId: 'lesson_2',
    unitId: 'unit_1',
    topic: 'Rounding Decimals',
    skill: 'Round decimal with carry-over',
    difficulty: QuestionDifficulty.HARD,
    questionText: {
      en: 'Round 0.96 to the nearest tenth.',
      vi: 'Làm tròn số 0,96 đến hàng phần mười gần nhất.'
    },
    type: 'numeric',
    correctAnswer: '1',
    solution: {
      en: 'The hundredths digit is 6. Rounding up 9 tenths gives 10 tenths, which is written as 1.',
      vi: 'Chữ số hàng phần trăm là 6. Làm tròn lên 9 phần mười được 10 phần mười, viết là 1.'
    },
    hint: {
      en: 'Adding 1 to 9 tenths makes 10 tenths, which carries over to the units place.',
      vi: 'Cộng thêm 1 vào 9 phần mười ta được 10 phần mười, tương đương 1 đơn vị ở hàng đơn vị.'
    },
    explanation: {
      en: 'Rounding 0.96 up increases the .9 to 1.0. We write the answer simply as 1.',
      vi: 'Làm tròn lên 0,96 làm tăng hàng phần mười từ 9 lên 10 phần mười, viết gọn là 1.'
    },
    commonMistake: {
      en: '0.9 (rounding down) or 0.10 (incorrectly formatting 10 tenths).',
      vi: '0,9 (làm tròn xuống) hoặc 0,10 (viết sai định dạng của 10 phần mười).'
    },
    thinkingSkill: 'Improving'
  },

  // LESSON 3 QUESTIONS: Comparing Fractions
  {
    id: 'q7',
    lessonId: 'lesson_3',
    unitId: 'unit_4',
    topic: 'Comparing Fractions',
    skill: 'Simplify fractions',
    difficulty: QuestionDifficulty.EASY,
    questionText: {
      en: 'Simplify the fraction 8/12 to its simplest terms. (Write answer in form a/b, e.g. 2/3)',
      vi: 'Rút gọn phân số 8/12 về dạng tối giản. (Viết kết quả ở dạng a/b, ví dụ 2/3)'
    },
    type: 'text-input',
    correctAnswer: '2/3',
    solution: {
      en: 'The GCF of 8 and 12 is 4. Divide both top and bottom by 4 to get 2/3.',
      vi: 'ƯCLN của 8 và 12 là 4. Chia cả tử và mẫu cho 4 ta được 2/3.'
    },
    hint: {
      en: 'What is the largest number that can divide both 8 and 12?',
      vi: 'Số lớn nhất chia hết cho cả 8 và 12 là số nào?'
    },
    explanation: {
      en: 'Dividing 8 by 4 gives 2. Dividing 12 by 4 gives 3. The simplest equivalent fraction is 2/3.',
      vi: 'Chia 8 cho 4 được 2. Chia 12 cho 4 được 3. Phân số tối giản là 2/3.'
    },
    commonMistake: {
      en: '4/6 (not fully simplified).',
      vi: '4/6 (chưa tối giản hết).'
    },
    thinkingSkill: 'Characterising'
  },
  {
    id: 'q8',
    lessonId: 'lesson_3',
    unitId: 'unit_4',
    topic: 'Comparing Fractions',
    skill: 'Solve equivalent fraction variables',
    difficulty: QuestionDifficulty.MEDIUM,
    questionText: {
      en: 'Solve for x: 3/7 = x/28',
      vi: 'Tìm x biết: 3/7 = x/28'
    },
    type: 'numeric',
    correctAnswer: '12',
    solution: {
      en: 'To scale the denominator from 7 to 28, we multiply by 4. So we must multiply the numerator 3 by 4: 3 x 4 = 12.',
      vi: 'Để tăng mẫu số từ 7 lên 28, ta nhân với 4. Do đó ta cũng nhân tử số 3 với 4: 3 x 4 = 12.'
    },
    hint: {
      en: 'What did you multiply 7 by to get 28? Do the same to 3.',
      vi: 'Em đã nhân 7 với số nào để được 28? Hãy làm tương tự với số 3.'
    },
    explanation: {
      en: 'Since 7 x 4 = 28, the scaling factor is 4. Applying this to the numerator: 3 x 4 = 12.',
      vi: 'Vì 7 x 4 = 28, hệ số quy đồng là 4. Áp dụng vào tử số: 3 x 4 = 12.'
    },
    commonMistake: {
      en: '14 (adding 7 to the numerator instead of multiplying by 4).',
      vi: '14 (cộng thêm 7 vào tử số thay vì nhân với 4).'
    },
    thinkingSkill: 'Generalising'
  },
  {
    id: 'q9',
    lessonId: 'lesson_3',
    unitId: 'unit_4',
    topic: 'Comparing Fractions',
    skill: 'Compare fractions with different denominators',
    difficulty: QuestionDifficulty.HARD,
    questionText: {
      en: 'Which is larger: 3/4 or 5/6? (Write the larger fraction as a/b, e.g. 5/6)',
      vi: 'Phân số nào lớn hơn: 3/4 hay 5/6? (Viết phân số lớn hơn ở dạng a/b, ví dụ 5/6)'
    },
    type: 'text-input',
    correctAnswer: '5/6',
    solution: {
      en: 'Common denominator of 4 and 6 is 12. 3/4 = 9/12 and 5/6 = 10/12. Since 10/12 > 9/12, 5/6 is larger.',
      vi: 'Mẫu số chung của 4 và 6 là 12. Quy đồng ta được: 3/4 = 9/12 và 5/6 = 10/12. Vì 10/12 > 9/12 nên 5/6 lớn hơn.'
    },
    hint: {
      en: 'Convert both fractions to have a denominator of 12.',
      vi: 'Quy đồng cả hai phân số về mẫu số chung là 12.'
    },
    explanation: {
      en: '9/12 (3/4) is smaller than 10/12 (5/6) by exactly 1/12.',
      vi: '9/12 (3/4) nhỏ hơn 10/12 (5/6) đúng 1/12.'
    },
    commonMistake: {
      en: '3/4 (incorrect comparison).',
      vi: '3/4 (so sánh sai).'
    },
    thinkingSkill: 'Critiquing'
  },

  // LESSON 4 QUESTIONS: Percentages of quantities
  {
    id: 'q10',
    lessonId: 'lesson_4',
    unitId: 'unit_4',
    topic: 'Percentages',
    skill: 'Calculate 25% of quantity',
    difficulty: QuestionDifficulty.EASY,
    questionText: {
      en: 'Calculate 25% of $120. (Write the number only, e.g. 30)',
      vi: 'Tính 25% của $120. (Chỉ ghi số, ví dụ 30)'
    },
    type: 'numeric',
    correctAnswer: '30',
    solution: {
      en: '25% is equivalent to 1/4. $120 divided by 4 equals $30.',
      vi: '25% tương đương với 1/4. Lấy $120 chia cho 4 ta được $30.'
    },
    hint: {
      en: 'Divide $120 by 4, or find half of $120 (50%) and half it again.',
      vi: 'Chia $120 cho 4, hoặc tìm một nửa của $120 (50%) rồi chia đôi tiếp.'
    },
    explanation: {
      en: '25% of a quantity is 1/4 of it. 120 / 4 = 30.',
      vi: '25% của một đại lượng là 1/4 của đại lượng đó. 120 / 4 = 30.'
    },
    commonMistake: {
      en: '25 (confusing the percentage rate with the actual calculated amount).',
      vi: '25 (nhầm lẫn tỉ lệ phần trăm với giá trị thực tế tính toán).'
    },
    thinkingSkill: 'Specialising'
  },
  {
    id: 'q11',
    lessonId: 'lesson_4',
    unitId: 'unit_4',
    topic: 'Percentages',
    skill: 'Calculate 75% of quantity',
    difficulty: QuestionDifficulty.MEDIUM,
    questionText: {
      en: 'Find 75% of 60 meters. (Write number only)',
      vi: 'Tìm 75% của 60 mét. (Chỉ ghi số)'
    },
    type: 'numeric',
    correctAnswer: '45',
    solution: {
      en: 'First find 25% of 60: 60 / 4 = 15. Then multiply by 3 to get 75%: 15 x 3 = 45 meters.',
      vi: 'Trước tiên tìm 25% của 60: 60 / 4 = 15. Sau đó nhân với 3 để được 75%: 15 x 3 = 45 mét.'
    },
    hint: {
      en: 'Find 25% (one quarter) first, then multiply it by 3.',
      vi: 'Hãy tìm 25% (một phần tư) trước, rồi nhân kết quả đó với 3.'
    },
    explanation: {
      en: '75% is 3/4. 60 divided by 4 is 15. 15 times 3 is 45.',
      vi: '75% là 3/4. 60 chia cho 4 được 15. 15 nhân 3 được 45.'
    },
    commonMistake: {
      en: '15 (which is 25%) or 30 (which is 50%).',
      vi: '15 (đây là 25%) hoặc 30 (đây là 50%).'
    },
    thinkingSkill: 'Generalising'
  },
  {
    id: 'q12',
    lessonId: 'lesson_4',
    unitId: 'unit_4',
    topic: 'Percentages',
    skill: 'Calculate percentage discounts',
    difficulty: QuestionDifficulty.HARD,
    questionText: {
      en: 'A shop offers a 10% discount on a jacket that costs $90. What is the new sale price of the jacket? (Write number only)',
      vi: 'Một cửa hàng giảm giá 10% cho chiếc áo khoác có giá gốc $90. Giá mới sau khi giảm của chiếc áo khoác là bao nhiêu? (Chỉ ghi số)'
    },
    type: 'numeric',
    correctAnswer: '81',
    solution: {
      en: 'First find the discount amount: 10% of $90 = $9. The sale price is the original price minus discount: $90 - $9 = $81.',
      vi: 'Trước tiên tính số tiền được giảm: 10% của $90 = $9. Giá bán mới bằng giá gốc trừ đi tiền giảm: $90 - $9 = $81.'
    },
    hint: {
      en: 'Find 10% of $90, then subtract that amount from the original price of $90.',
      vi: 'Tìm 10% của $90, rồi lấy giá gốc $90 trừ đi số tiền giảm đó.'
    },
    explanation: {
      en: '10% of 90 is 9. The price is reduced by $9. 90 - 9 = 81.',
      vi: '10% của 90 là 9. Giá bán được giảm đi $9. 90 - 9 = 81.'
    },
    commonMistake: {
      en: '9 (this is the discount amount, not the new price) or 80.',
      vi: '9 (đây là số tiền được giảm, không phải giá bán mới) hoặc 80.'
    },
    thinkingSkill: 'Critiquing'
  },

  // LESSON 5 QUESTIONS: Ratio and Direct Proportion
  {
    id: 'q13',
    lessonId: 'lesson_5',
    unitId: 'unit_11',
    topic: 'Proportion',
    skill: 'Scale quantities in proportion',
    difficulty: QuestionDifficulty.EASY,
    questionText: {
      en: 'If 4 identical notebooks cost $20, how much do 12 of these notebooks cost? (Write number only)',
      vi: 'Nếu 4 quyển vở giống hệt nhau có giá $20, thì 12 quyển vở như vậy có giá bao nhiêu? (Chỉ ghi số)'
    },
    type: 'numeric',
    correctAnswer: '60',
    solution: {
      en: 'The scale factor from 4 to 12 is 3 (since 12 / 4 = 3). Multiply the original cost by 3: $20 x 3 = $60.',
      vi: 'Hệ số tỉ lệ từ 4 lên 12 là 3 (vì 12 / 4 = 3). Nhân giá tiền ban đầu với 3: $20 x 3 = $60.'
    },
    hint: {
      en: '12 notebooks is exactly 3 times more than 4 notebooks. Multiply the cost by 3.',
      vi: '12 quyển vở gấp đúng 3 lần so với 4 quyển vở. Hãy nhân giá tiền lên 3 lần.'
    },
    explanation: {
      en: 'Since the number of notebooks is tripled, the total price is also tripled. 20 x 3 = 60.',
      vi: 'Vì số lượng vở tăng gấp 3 lần, tổng giá tiền cũng tăng gấp 3 lần. 20 x 3 = 60.'
    },
    commonMistake: {
      en: '240 (multiplying $20 by 12 directly instead of using the scale factor 3).',
      vi: '240 (nhân trực tiếp $20 với 12 thay vì nhân với hệ số tỉ lệ là 3).'
    },
    thinkingSkill: 'Generalising'
  },
  {
    id: 'q14',
    lessonId: 'lesson_5',
    unitId: 'unit_11',
    topic: 'Proportion',
    skill: 'Solve recipe scaling',
    difficulty: QuestionDifficulty.MEDIUM,
    questionText: {
      en: 'A recipe for 6 people requires 300 grams of flour. How many grams of flour are needed for 9 people? (Write number only)',
      vi: 'Công thức nấu ăn cho 6 người cần 300 gam bột mì. Cần bao nhiêu gam bột mì cho 9 người? (Chỉ ghi số)'
    },
    type: 'numeric',
    correctAnswer: '450',
    solution: {
      en: 'Find the flour needed for 1 person: 300g / 6 = 50g. For 9 people: 50g x 9 = 450 grams.',
      vi: 'Tìm lượng bột cần cho 1 người: 300g / 6 = 50g. Cho 9 người: 50g x 9 = 450 gam.'
    },
    hint: {
      en: 'First calculate how much flour is needed for just 1 person, then multiply by 9.',
      vi: 'Trước tiên hãy tính xem 1 người cần bao nhiêu gam bột mì, rồi nhân kết quả đó với 9.'
    },
    explanation: {
      en: 'Using the unitary method, 300 / 6 = 50 grams per person. 50 x 9 = 450 grams for 9 people.',
      vi: 'Áp dụng phương pháp rút về đơn vị, 300 / 6 = 50 gam mỗi người. 50 x 9 = 450 gam cho 9 người.'
    },
    commonMistake: {
      en: '150 (calculating for 3 people instead of 9) or 600.',
      vi: '150 (tính cho 3 người thay vì 9 người) hoặc 600.'
    },
    thinkingSkill: 'Specialising'
  },
  {
    id: 'q15',
    lessonId: 'lesson_5',
    unitId: 'unit_11',
    topic: 'Proportion',
    skill: 'Calculate gasoline usage scale',
    difficulty: QuestionDifficulty.HARD,
    questionText: {
      en: 'An automobile travels 150 km on 10 liters of petrol. How many liters of petrol does it need to travel 600 km? (Write number only)',
      vi: 'Một chiếc ô tô đi được 150 km tiêu hao 10 lít xăng. Chiếc ô tô đó cần bao nhiêu lít xăng để đi được quãng đường 600 km? (Chỉ ghi số)'
    },
    type: 'numeric',
    correctAnswer: '40',
    solution: {
      en: 'The scale factor for distance is 4 (since 600 / 150 = 4). Multiply the petrol needed by 4: 10 liters x 4 = 40 liters.',
      vi: 'Hệ số tỉ lệ cho quãng đường là 4 (vì 600 / 150 = 4). Nhân lượng xăng tiêu thụ với 4: 10 lít x 4 = 40 lít.'
    },
    hint: {
      en: '600 km is 4 times longer than 150 km. Multiply the liters of petrol by 4.',
      vi: '600 km dài gấp 4 lần so với 150 km. Hãy nhân số lít xăng với 4.'
    },
    explanation: {
      en: 'Distance increases by 4 times, so gasoline needed increases by 4 times. 10 x 4 = 40.',
      vi: 'Quãng đường tăng 4 lần, nên xăng tiêu thụ cũng tăng 4 lần. 10 x 4 = 40.'
    },
    commonMistake: {
      en: '60 (using wrong scale calculation).',
      vi: '60 (tính sai hệ số tỉ lệ).'
    },
    thinkingSkill: 'Convincing'
  },
  
  // LESSON 6 QUESTIONS: Coordinate Transformations
  {
    id: 'q16',
    lessonId: 'lesson_6',
    unitId: 'unit_16',
    topic: 'Transformations',
    skill: 'Translate shapes on grid',
    difficulty: QuestionDifficulty.EASY,
    questionText: {
      en: 'Translate point A(2, 3) by vector (1, -2). What are the new coordinates? (Format: (x,y) e.g., (3,1))',
      vi: 'Tịnh tiến điểm A(2, 3) theo vectơ (1, -2). Tọa độ của điểm mới là bao nhiêu? (Định dạng: (x,y) e.g., (3,1))'
    },
    type: 'numeric',
    correctAnswer: '(3,1)',
    solution: {
      en: 'Add 1 to x-coordinate and subtract 2 from y-coordinate: A\' = (2+1, 3-2) = (3,1).',
      vi: 'Cộng 1 vào tọa độ x và trừ 2 vào tọa độ y: A\' = (2+1, 3-2) = (3,1).'
    },
    hint: {
      en: 'The vector (1, -2) tells you to shift right by 1 and down by 2.',
      vi: 'Vectơ (1, -2) bảo em dịch sang phải 1 đơn vị và dịch xuống dưới 2 đơn vị.'
    },
    explanation: {
      en: 'x\' = x + 1, y\' = y - 2. For (2,3), new coordinate is (2+1, 3-2) = (3,1).',
      vi: 'x\' = x + 1, y\' = y - 2. Với (2,3), tọa độ mới là (2+1, 3-2) = (3,1).'
    },
    commonMistake: {
      en: '(1,5) (subtracting from x and adding to y) or (3,5).',
      vi: '(1,5) (trừ ở x và cộng ở y) hoặc (3,5).'
    },
    thinkingSkill: 'Conjecturing'
  },
  {
    id: 'q17',
    lessonId: 'lesson_6',
    unitId: 'unit_16',
    topic: 'Transformations',
    skill: 'Reflect shapes on grid',
    difficulty: QuestionDifficulty.MEDIUM,
    questionText: {
      en: 'If point P(4, 2) is reflected across the x-axis, what are the new coordinates? (Format: (x,y) e.g., (4,-2))',
      vi: 'Nếu điểm P(4, 2) đối xứng qua trục hoành x, tọa độ của điểm mới là bao nhiêu? (Định dạng: (x,y) e.g., (4,-2))'
    },
    type: 'numeric',
    correctAnswer: '(4,-2)',
    solution: {
      en: 'Reflection across the x-axis keeps the x-coordinate same but negates the y-coordinate: P\' = (4, -2).',
      vi: 'Đối xứng qua trục x giữ nguyên hoành độ x nhưng đổi dấu tung độ y: P\' = (4, -2).'
    },
    hint: {
      en: 'A point reflected across the horizontal x-axis moves vertically across the axis. x stays same, y flips sign.',
      vi: 'Một điểm đối xứng qua trục hoành x sẽ di chuyển thẳng đứng qua trục đó. x giữ nguyên, y đổi dấu.'
    },
    explanation: {
      en: '(x, y) becomes (x, -y) under reflection across x-axis. So (4, 2) becomes (4, -2).',
      vi: '(x, y) chuyển thành (x, -y) khi đối xứng qua trục x. Vậy (4, 2) chuyển thành (4, -2).'
    },
    commonMistake: {
      en: '(-4,2) (reflecting across y-axis instead) or (-4,-2).',
      vi: '(-4,2) (đối xứng qua trục y) hoặc (-4,-2).'
    },
    thinkingSkill: 'Specialising'
  },
  {
    id: 'q18',
    lessonId: 'lesson_6',
    unitId: 'unit_16',
    topic: 'Transformations',
    skill: 'Rotate shapes on grid',
    difficulty: QuestionDifficulty.HARD,
    questionText: {
      en: 'Rotate point Q(1, 2) 90 degrees counterclockwise around the origin (0,0). What are the coordinates of Q\'? (Format: (x,y) e.g., (-2,1))',
      vi: 'Quay điểm Q(1, 2) một góc 90 độ ngược chiều kim đồng hồ quanh gốc tọa độ (0,0). Tọa độ Q\' là bao nhiêu? (Định dạng: (x,y) e.g., (-2,1))'
    },
    type: 'numeric',
    correctAnswer: '(-2,1)',
    solution: {
      en: 'A 90 degrees counterclockwise rotation around origin maps (x, y) to (-y, x). So Q(1, 2) becomes Q\'(-2, 1).',
      vi: 'Góc quay 90 độ ngược chiều kim đồng hồ quanh gốc tọa độ biến (x, y) thành (-y, x). Vậy Q(1, 2) trở thành Q\'(-2, 1).'
    },
    hint: {
      en: 'Draw Q(1,2) on a grid. Rotate the vector from (0,0) to Q by 90 degrees left. The new coordinates will swap values and the new x will be negative.',
      vi: 'Vẽ Q(1,2) trên lưới. Quay đoạn nối gốc tọa độ và Q sang trái 90 độ. Tọa độ mới tráo đổi trị số và hoành độ x mới mang dấu âm.'
    },
    explanation: {
      en: 'Rotation of 90 degrees CCW swaps the coordinates and negates the first term: (x, y) -> (-y, x). (1, 2) -> (-2, 1).',
      vi: 'Quay 90 độ ngược chiều kim đồng hồ tráo vị trí hai tọa độ và đổi dấu số hạng thứ nhất: (x, y) -> (-y, x). (1, 2) -> (-2, 1).'
    },
    commonMistake: {
      en: '(2,1) (swapping only) or (-1,-2) (rotating 180 degrees).',
      vi: '(2,1) (chỉ tráo đổi vị trí) hoặc (-1,-2) (quay 180 độ).'
    },
    thinkingSkill: 'Critiquing'
  },
  
  // LESSON 7 QUESTIONS: Rotational Symmetry
  {
    id: 'q19',
    lessonId: 'lesson_7',
    unitId: 'unit_16',
    topic: 'Rotational Symmetry',
    skill: 'Determine rotational symmetry order',
    difficulty: QuestionDifficulty.EASY,
    questionText: {
      en: 'What is the order of rotational symmetry of a regular octagon (8-sided polygon)? (Write number only)',
      vi: 'Bậc đối xứng quay của một bát giác đều (đa giác đều 8 cạnh) là bao nhiêu? (Chỉ ghi số)'
    },
    type: 'numeric',
    correctAnswer: '8',
    solution: {
      en: 'A regular polygon with n sides has rotational symmetry of order n. So a regular octagon has order 8.',
      vi: 'Một đa giác đều có n cạnh thì có đối xứng quay bậc n. Vậy một bát giác đều có đối xứng quay bậc 8.'
    },
    hint: {
      en: 'Count the number of vertices or sides. A regular polygon always matches its side count.',
      vi: 'Hãy đếm số đỉnh hoặc số cạnh. Một đa giác đều luôn có bậc đối xứng bằng số cạnh của nó.'
    },
    explanation: {
      en: 'For any regular polygon, order of rotational symmetry is equal to the number of sides. Octagon = 8 sides, order = 8.',
      vi: 'Với đa giác đều bất kỳ, bậc đối xứng quay bằng số cạnh của nó. Bát giác đều = 8 cạnh, bậc đối xứng = 8.'
    },
    commonMistake: {
      en: '4 (confusing with square) or 16.',
      vi: '4 (nhầm với hình vuông) hoặc 16.'
    },
    thinkingSkill: 'Generalising'
  },
  {
    id: 'q20',
    lessonId: 'lesson_7',
    unitId: 'unit_16',
    topic: 'Rotational Symmetry',
    skill: 'Calculate angle of rotational symmetry',
    difficulty: QuestionDifficulty.MEDIUM,
    questionText: {
      en: 'What is the minimum angle of rotation (in degrees) for a regular hexagon to look identical to itself? (Write number only)',
      vi: 'Góc xoay tối thiểu (tính bằng độ) để một lục giác đều trông giống hệt chính nó là bao nhiêu? (Chỉ ghi số)'
    },
    type: 'numeric',
    correctAnswer: '60',
    solution: {
      en: 'Divide 360 degrees by the order of symmetry (6 for a hexagon): 360 / 6 = 60 degrees.',
      vi: 'Chia 360 độ cho bậc đối xứng quay (6 đối với lục giác đều): 360 / 6 = 60 độ.'
    },
    hint: {
      en: 'The formula is: Angle = 360 / Order of symmetry. A hexagon has 6 sides.',
      vi: 'Công thức là: Góc quay = 360 / Bậc đối xứng. Hình lục giác đều có 6 cạnh.'
    },
    explanation: {
      en: 'Symmetry angle = 360 / n, where n = 6. 360 / 6 = 60 degrees.',
      vi: 'Góc đối xứng = 360 / n, với n = 6. 360 / 6 = 60 độ.'
    },
    commonMistake: {
      en: '120 (interior angle of hexagon instead) or 90.',
      vi: '120 (góc trong lục giác) hoặc 90.'
    },
    thinkingSkill: 'Convincing'
  }
];
