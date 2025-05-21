

function createFormCopies() {
  const TEMPLATE_FORM_ID = 'ID_OF_QUESTIONS_BANK_FORM';
  const DESTINATION_FOLDER_ID = 'ID_OF_DESTINATION_FOLDER';
  const COPIES_COUNT = 1; // Скільки копій зробити

  const templateFile = DriveApp.getFileById(TEMPLATE_FORM_ID);
  const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);

  for (let i = 1; i <= COPIES_COUNT; i++) {
    const copyName = `Варіант №${i}`;
    const newFile = templateFile.makeCopy(copyName, destinationFolder);
    Logger.log(`Створено: ${copyName} → ${newFile.getUrl()}`);
  }
  processFormsInFolder(DESTINATION_FOLDER_ID)
}

function processFormsInFolder(fid) {
  const FOLDER_ID = fid;
  const QUESTIONS_PER_SECTION = 2;
  const SHUFFLE_QUESTIONS_ORDER = true;

  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByType(MimeType.GOOGLE_FORMS);

  while (files.hasNext()) {
    const file = files.next();
    const form = FormApp.openById(file.getId());
    if (SHUFFLE_QUESTIONS_ORDER){
        form.setShuffleQuestions(true);
    }
    Logger.log(`Обрабатываем форму: ${form.getTitle()}`);

    const items = form.getItems();
    const sections = [];
    let currentSection = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.getType() === FormApp.ItemType.PAGE_BREAK) {
        if (currentSection.length > 0) {
          sections.push(currentSection);
        }
        currentSection = [];
      } else {
        currentSection.push(item);
      }      
    }
    if (currentSection.length > 0) {
      sections.push(currentSection);
    }

    // Обрабатываем только со второй секции (индекс 1 и дальше)
    for (let s = 1; s < sections.length; s++) {
      const section = sections[s];
      const kept = pickRandomItems(section, QUESTIONS_PER_SECTION);
      const idsToKeep = kept.map(i => i.getId());

      for (const item of section) {
        if (!idsToKeep.includes(item.getId())) {
          form.deleteItem(item);
        }
      }
    }

    // Создаём MD5-хеш от ID + времени
    const uniqueString = file.getId() + new Date().getTime();
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, uniqueString);
    const hashHex = hash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');

    //form.setTitle(hashHex);
    file.setName(hashHex);

    Logger.log(`Переименовано в: ${hashHex}`);
  }
}

// Выбирает случайные N элементов из массива
function pickRandomItems(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}
/*
function enableShuffleOptionsForAllQuestions(form) {
  form.setShuffleQuestions(true);
  return;
  const items = form.getItems();

  for (const item of items) {
    const type = item.getType();
    try {
      switch (type) {
        case FormApp.ItemType.MULTIPLE_CHOICE:
          item.asMultipleChoiceItem().setShuffleOrder(true);
          Logger.log(`Shuffle enabled for Multiple Choice: ${item.getTitle()}`);
          break;
        case FormApp.ItemType.CHECKBOX:
          item.asCheckboxItem().setShuffleOrder(true);
          Logger.log(`Shuffle enabled for Checkbox: ${item.getTitle()}`);
          break;
        case FormApp.ItemType.LIST:
          item.asListItem().setShuffleOrder(true);
          Logger.log(`Shuffle enabled for List: ${item.getTitle()}`);
          break;
      }
    } catch (e) {
      Logger.log(`Ошибка при установке shuffle для вопроса "${item.getTitle()}": ${e}`);
    }
  }
}
*/
