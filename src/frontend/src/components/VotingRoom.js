import React, { useEffect } from "react";
import VotingService from "../services/VotingService";

const VotingRoom = ({ votingContextData }) => {
    useEffect(()=>{
        const timeoutHandler = setTimeout(() => {
            console.log('Starting');
            VotingService.requestListMembers(votingContextData.roomId, votingContextData.memberId);
            VotingService.hookToServerSentEventsStream(votingContextData.memberId, processEventFromVotingService);
            console.log('Done');
        }, 1000);

        return () => {
            console.log('Removing timer');
            clearTimeout(timeoutHandler);
        } 
    }, []);

    const processEventFromVotingService = eventFromService => {
        console.log("[SSE]: " + JSON.stringify(eventFromService));
    };

    return (
        <>
        <p>Is Leader: {votingContextData.isLeader ? "yes" : "no"}</p>
        <p>Room Id: {votingContextData.roomId}</p>
        <p>Member Id: {votingContextData.memberId}</p>
        </>
    );
}

export default VotingRoom;
