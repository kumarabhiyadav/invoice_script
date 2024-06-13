const reader = require("xlsx");
const puppeteer = require("puppeteer");
const process = require("process");
var converter = require("number-to-words");
const fs = require("fs").promises;

(async function () {
  console.log(process.argv.length);

  if (process.argv.length < 3) {
    console.log("File name is required");
    process.exit(0);
  }

  let users = readExcelFile(process.argv[2]);

  for await (const user of users) {
    await createPDFFile(
      user,
      process.argv[2],
      process.argv[3],
      process.argv[4],
      process.argv[5],
      process.argv[6],
      process.argv[7],
      process.argv[8],

    );
  }
})();

async function createPDFFile(data, folder, companyName, companyAddress,companyEmail, state,gstNo,panNo) {
  folder = folder.replace("uploads/", "");
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Create a new page
  const page = await browser.newPage();

  // HTML content that you want to convert to a PDF
  const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>

    <style>
       @import url('https://fonts.googleapis.com/css2?family=Cabin:ital,wght@0,400..700;1,400..700&display=swap');

        body {
            font-family: "Cabin", sans-serif;
        }
        @page {
            size: auto;
            /* auto is the initial value */
            margin: 10px;
        }

         @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;

            }
        }

        

        .row {
            display: flex;
        }

        .row-end {
            justify-content: flex-end;
        }

        .row-space-between {
            justify-content: space-between;
        }

        .row-center {
            justify-content: center;
        }

        .bold {
            font-weight: 600;
        }

        .my-2 {
            margin: 2rem 0rem;
        }

        .my-1 {
            margin: 1rem 0rem;
        }

        .gray-color {
            background-color: rgb(221, 215, 215);
            print-color-adjust: exact;
            /* opacity: .3; */
        }

        .black-color {
            color: #000;
        }
    </style>
</head>

<body>
    <!-- <div class="row row-end">icon</div> -->

    <h3 class="row row-center" style="text-transform: uppercase; margin-bottom: .1em;">${companyName}</h3>
    <span class="row row-center" style="text-transform: uppercase;">${companyAddress}</span>
    ${gstNo ?  `<span class="row row-center" style="text-transform: uppercase;">GST NO&nbsp;:-&nbsp;${gstNo}</span>`:''}
    ${panNo ?  `<span class="row row-center" style="text-transform: uppercase;">PAN NO&nbsp;:-&nbsp;${panNo}</span>`:''}
    <span class="row row-center" style="text-transform: lowercase;">${companyEmail.replace('@','<span style="font-family:sans-serif;font-size:14px">&commat;</span>')}</span>


    <hr />
    <div class="row row-space-between">
        

        
        <div>
            <div class="row">
                <span class="bold">Name :&nbsp; </span>
                <span>${data.Name}</span>
            </div>

            ${
            data.City
            ? `<div class="row">
                <span class="bold">Address :&nbsp; </span>
                <span>${data.City}</span>
            </div>`
            : ""
            }

            <div class="row">
                <span class="bold">State :&nbsp; </span>
                <span>${data.State}</span>
            </div>

            ${
            data.Email
            ? `<div class="row">
                <span class="bold">Email :&nbsp; </span>
                <span>${data.Email.replace('@','<span style="font-family:sans-serif;font-size:14px">&commat;</span>')}</span>
            </div>`
            : ""
            }

            ${
            data.Mobile
            ? `<div class="row">
                <span class="bold">Mobile :&nbsp; </span>
                <span>${data.Mobile}</span>
            </div>`
            : ""
            }



            <!-- <div class="row">
                <span class="bold">State Code :&nbsp; </span>
                <span>${data.StateCode}</span>
            </div> -->
        </div>

        <div style="width: 11rem;">
            <div class="row">
                <span class="">Invoice No :&nbsp; </span>
                <span>${data.InvoiceNo}</span>
            </div>

            <div class="row">
                <span class="">Date :&nbsp; </span>
                <span>${new Date(data.Date).toLocaleDateString()}</span>
            </div>

            <div class="">
                <span class="">Payment :-&nbsp; </span>
                <span>${data.PaymentProvider}</span>
            </div>
        </div>
    </div>

    <div class="my-1">
        <div class="row gray-color row-space-between">
            <div class="black-color bold">Description</div>
            <div style="width: 11rem;" class="black-color bold">Amount (INR)</div>
        </div>
    </div>

    <div class="my-1">
        <div class="row row-space-between">
            <div>${data.Product}<br> <span style="font-size:14px"> Order ID : ${data.OrderNo}<span></div>
            <div style="width: 11rem; margin-right: -2rem;">${data.Amount}</div>
        </div>
    </div>



    <div class="row row-space-between">
        <div class="bold">Gross Amount</div>
        <div style="width: 11rem;margin-right: -2rem;" class="bold">${
            data.Amount -
            (getNinePercentOfNumber(data.Amount) +
            getNinePercentOfNumber(data.Amount))
            }
        </div>
    </div>
    <hr style="height: 1px; background-color: #000" />

    ${getCGSTORSGST(state, data.State, data.Amount)}

    <div class="my-2"></div>

    <div class="row row-space-between">
        <div class="bold">Grand Total</div>
        <div class="bold" style="width: 11rem;margin-right: -2rem;" >${data.Amount}</div>
    </div>
    <hr style="height: 1px; background-color: #000" />
    <div class="row row-space-between" style="text-transform: uppercase;">
        <div>Amount in word : ${getWordOfNumber(data.Amount)}</div>
    </div>


    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>

    <div class="row row-center">
        <div>This is a computer generated invoice</div>
    </div>

</body>

</html>`;

  // Set the HTML content of the page
  await page.setContent(htmlContent);

  const outputInvoicesDir = `outputInvoices/${folder}`;
  const dirExists = await fs
    .stat(outputInvoicesDir)
    .then(() => true)
    .catch(() => false);

  // If the directory doesn't exist, create it
  if (!dirExists) {
    await fs.mkdir(outputInvoicesDir, { recursive: true });
    console.log(`Created directory: ${outputInvoicesDir}`);
  }

  console.log(`outputInvoices/${folder}/` + data.InvoiceNo + ".pdf");
  const result = await page.pdf({
    path: `outputInvoices/${folder}/` + data.InvoiceNo + ".pdf", // Output file path
    // path: data.InvoiceNo+'.pdf', // Output file path

    format: "A4", // PDF format
  });

  console.log("result");

  // Close the browser
  await browser.close();

  console.log("PDF generated successfully!");
}

function readExcelFile(fileName) {
  const file = reader.readFile(fileName, {
    cellDates: true,
  });

  let data = [];
  const sheets = file.SheetNames;
  for (let i = 0; i < sheets.length; i++) {
    const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
    temp.forEach((res) => {
      data.push(res);
    });
  }

  return data;
}

function getNinePercentOfNumber(number) {
  return number * 0.09;
}

function getCGSTORSGST(companyState, userState, amount) {
  let state = userState.toLowerCase().trim().replace(" ", "_");
  if (companyState == state) {
    return ` <div class="row row-space-between">
        <div>SGST <span style="font-family:sans-serif;font-size:14px">&commat;</span>9% </div>
        <div style="width: 11rem;margin-right: -2rem;">${getNinePercentOfNumber(amount)}</div>
    </div>

    <div class="row row-space-between">
        <div>CGST <span style="font-family:sans-serif;font-size:14px">&commat;</span>9% </div>
        <div style="width: 11rem;margin-right: -2rem;">${getNinePercentOfNumber(amount)}</div>
    </div>`;
  } else {
    return `
    <div class="row row-space-between">
        <div>IGST <span style="font-family:sans-serif;font-size:14px">&commat;</span>18% </div>
        <div style="width: 11rem;margin-right: -2rem;">${2 * getNinePercentOfNumber(amount)}</div>
    </div>`;
  }
}

function getWordOfNumber(number) {
  return converter.toWords(number);
}
