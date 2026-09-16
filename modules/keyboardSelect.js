// | КЛАВИАТУРА ДЛЯ САМОПИСНЫХ СЕЛЕКТОВ — страна, валюта, регион.
// Tab до них доходит, но открыть список и выбрать пункт можно было только мышью.
// Закрытый селект: Enter, пробел и стрелки открывают список.
// Открытый: стрелки двигают подсветку, Enter (и пробел вне поиска) выбирает,
// Escape закрывает, Tab закрывает и уводит фокус дальше. Выбор идёт через
// click() по пункту, поэтому логика применения остаётся в обработчиках клика.
const HIGHLIGHT_CLASS = "is-highlighted";
const OPEN_KEYS = ["Enter", " ", "ArrowDown", "ArrowUp"];

export const enableKeyboardSelect = ({
  root, // обёртка селекта: ловит keydown и от триггера, и от поиска внутри
  trigger, // элемент, который получает фокус по Tab
  getItems, // () => пункты списка
  getSelected, // (items) => пункт текущего значения, с него начинается подсветка
  isOpen,
  open,
  close,
  onOpen, // после открытия с клавиатуры, например фокус в поиск
}) => {
  let index = -1;

  const clearHighlight = () => {
    root
      .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
      .forEach((item) => item.classList.remove(HIGHLIGHT_CLASS));
    index = -1;
  };

  const highlight = (next) => {
    const items = getItems();
    clearHighlight();
    if (!items.length) return;
    index = (next + items.length) % items.length;
    items[index].classList.add(HIGHLIGHT_CLASS);
    items[index].scrollIntoView({ block: "nearest" });
  };

  const choose = () => {
    const item = getItems()[index];
    if (!item) return;
    item.click();
    clearHighlight();
    trigger.focus({ preventScroll: true });
  };

  root.addEventListener("keydown", (event) => {
    if (!isOpen()) {
      if (!OPEN_KEYS.includes(event.key)) return;
      event.preventDefault();
      open();
      const items = getItems();
      highlight(Math.max(items.indexOf(getSelected?.(items)), 0));
      onOpen?.();
      return;
    }

    // В поле поиска пробел — это текст, а не выбор пункта.
    const typing = event.target.matches?.("input:not([readonly])");

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      highlight(index + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" || (event.key === " " && !typing)) {
      event.preventDefault();
      choose();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
      clearHighlight();
      trigger.focus({ preventScroll: true });
    } else if (event.key === "Tab") {
      // Фокус мог быть в поиске, который сейчас скроется: возвращаем его на
      // триггер, и Tab продолжит обход с места селекта.
      close();
      clearHighlight();
      if (document.activeElement !== trigger) {
        trigger.focus({ preventScroll: true });
      }
    }
  });

  // Мышью подсветка не нужна: убираем хвост от прошлого выбора с клавиатуры.
  root.addEventListener("mousedown", clearHighlight);

  // Для поиска: список перерисован — подсвечиваем первый найденный пункт.
  return { highlightFirst: () => highlight(0) };
};
