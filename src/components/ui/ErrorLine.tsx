// Сообщение об ошибке над кнопкой действия: пустая строка ничего не рисует.
export default function ErrorLine({text}: {text: string}) {
    if (!text) return null;
    return <p className="trade-error" role="alert">{text}</p>;
}
