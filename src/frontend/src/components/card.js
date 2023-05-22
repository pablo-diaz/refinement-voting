const Card = ({ cardContextData }) => {
    const handleClickEvent = e => {
        if(cardContextData.onClick)
            cardContextData.onClick(e);
    }

    const getSelectionClass = () => cardContextData.selected ? "btn-success" : "";

    const getVotedAlreadyClass = () => cardContextData.voteSubmitted ? "btn-warning" : "";

    return (
        <>
        <div className="card" onClick={handleClickEvent}>
            <div className={`card-body ${getSelectionClass()} ${getVotedAlreadyClass()}`}>
                {
                    cardContextData.memberName &&
                    <h2>{cardContextData.memberName}</h2>
                }
                <h1>{ cardContextData.label }</h1>
            </div>
        </div>
        </>
    );
}

export default Card;