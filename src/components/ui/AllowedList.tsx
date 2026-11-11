// «Можно положить»: каждая строка с иконкой ресурса, как в референсе ангара.
import {resourceByName} from '../../lib/catalog';
import {HangarIcon} from './HangarIcon';

export default function AllowedList({names}: {names: string[]}) {
    if (names.length === 0) return null;
    return (
        <div className="trade-cargo-list shop-cargo-list">
            {names.map((name) => {
                const resource = resourceByName(name);
                return (
                    <div className="trade-cargo-row" key={name}>
                        <span className="trade-cargo-icon">
                            <HangarIcon name={resource?.icon || 'crate'} size={13}/>
                        </span>
                        <span className="trade-cargo-name">{resource?.name || name}</span>
                    </div>
                );
            })}
        </div>
    );
}
