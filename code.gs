//appscript code

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
}

function createAttendanceForm() {
  
  const form = FormApp.create("Attendance Form");
  form.setDescription("Please fill out your attendance details.");
  
  
  form.addTextItem().setTitle("Full Name").setRequired(true);
  form.addTextItem().setTitle("Email").setRequired(true);
  
  
  const formUrl = form.getPublishedUrl();
  
  
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(formUrl)}&size=200`;

  return { formUrl: formUrl, qrUrl: qrUrl };
}
