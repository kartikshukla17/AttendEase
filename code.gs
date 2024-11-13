//appscript code 

//todo: for each event new column
//todo: update the proctor sheet with proper message of event name and event date!
//todo: shorten the links generated 

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Attendance System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createAttendanceForm(organiserEmail) {
  const form = FormApp.create("Attendance Form")
    .setDescription("Please fill out your attendance details.")
    .addTextItem().setTitle("USN").setRequired(true)
    .addTextItem().setTitle("Full Name").setRequired(true)
    .addTextItem().setTitle("Email").setRequired(true);

  const formUrl = form.getPublishedUrl();
  const sheet = SpreadsheetApp.create("Attendance Form Responses");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  sheet.addEditor(organiserEmail);
  form.addEditor(organiserEmail);

  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(formUrl)}&size=200`;

  PropertiesService.getScriptProperties().setProperty('responseSheetId', sheet.getId());

  return {
    formUrl, 
    qrUrl,
    sheetUrl: sheet.getUrl(),
  };
}

function updateSheetWithUSNs(usnList, sheet, usnColumn, messageColumn, message) {
  try {
    const dataRange = sheet.getRange(2, usnColumn, sheet.getLastRow() - 1, 1);
    const sheetData = dataRange.getValues().map(row => row[0].toString().trim());

    const updates = sheetData.map(usn => [usnList.includes(usn) ? message : "Absent"]);
    
    if (updates.length) {
      sheet.getRange(2, messageColumn, updates.length, 1).setValues(updates);
      return { success: true, message: `Updated ${updates.length} rows` };
    }

    return { success: false, message: 'No updates made' };
  } catch (error) {
    Logger.log(`Error in updateSheetWithUSNs: ${error}`);
    return { success: false, message: `Error updating sheet: ${error}` };
  }
}

function updateAttendance() {
  try {
    const responseSheetId = PropertiesService.getScriptProperties().getProperty('responseSheetId');
    const mainSpreadsheetId = '1dOBfVLhJbhnvdP6a0c2SNLiTnpkXPGDTiIVn3KYc3pk';

    if (!responseSheetId || !mainSpreadsheetId) {
      return { success: false, message: "Missing spreadsheet IDs" };
    }

    const responseSheet = SpreadsheetApp.openById(responseSheetId);
    const mainSpreadsheet = SpreadsheetApp.openById(mainSpreadsheetId);

    const [mainSheet, sheet2, sheet3] = [
      responseSheet.getSheets()[0],
      mainSpreadsheet.getSheetByName('proctor1'),
      mainSpreadsheet.getSheetByName('proctor2')
    ];

    if (!mainSheet || !sheet2 || !sheet3) {
      return { success: false, message: "One or more sheets are missing" };
    }

    const usnColumn = 2, messageColumn = 3, message = "Present";
    const mainData = mainSheet.getRange(2, usnColumn, mainSheet.getLastRow() - 1, 1)
      .getValues()
      .flat()
      .map(usn => usn.toString().trim())
      .filter(Boolean);

    if (!mainData.length) {
      return { success: false, message: "No valid USNs found" };
    }

    const result1 = updateSheetWithUSNs(mainData, sheet2, usnColumn, messageColumn, message);
    const result2 = updateSheetWithUSNs(mainData, sheet3, usnColumn, messageColumn, message);

    return {
      success: result1.success && result2.success,
      message: `Update complete:\n- Proctor1: ${result1.message}\n- Proctor2: ${result2.message}`,
      details: {
        proctor1: result1,
        proctor2: result2,
        totalUSNs: mainData.length
      }
    };
  } catch (error) {
    Logger.log(`Error in updateAttendance: ${error}`);
    return { success: false, message: `Error: ${error}` };
  }
}


