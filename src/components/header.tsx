// Содержимое шапки панели: метка, заголовок и подпись проекта.
interface Props {
    label: string;
    header: string;
    project: string;
}

export default function Header({label, header, project}: Props) {
    return (
        <>
            <div className="portal-panel-brand">
                <span>{label}</span>
                <strong>{header}</strong>
            </div>
            <small>{project}</small>
        </>
    );
}
