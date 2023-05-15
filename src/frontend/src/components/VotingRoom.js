const VotingRoom = ({ votingContextData }) => {
    return (
        <>
        <p>Is Leader: {votingContextData.isLeader ? "yes" : "no"}</p>
        <p>Room Id: {votingContextData.roomId}</p>
        <p>Member Id: {votingContextData.memberId}</p>
        </>
    );
}

export default VotingRoom;
