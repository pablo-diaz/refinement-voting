import React, { useEffect, useState } from "react";
import VotingService from "../services/VotingService";

const VotingRoom = ({ votingContextData }) => {
    useEffect(()=>{
        const timeoutHandler = setTimeout(() => {
            console.log('Starting');
            VotingService.requestListMembers(votingContextData.roomId, votingContextData.memberId);
            VotingService.hookToServerSentEventsStream(votingContextData.memberId, processEventFromVotingService);
            console.log('Done');
        }, 3000);

        return () => {
            console.log('Removing timer');
            clearTimeout(timeoutHandler);
        } 
    }, []);

    const [state, setState] = useState({ members: new Set() });

    const processNewMemberHasJoinedEvent = eventData => {
        var newState = {...state};
        newState['members'].add(eventData.MemberName);
        setState(newState);
    };

    const processEventFromVotingService = messageFromService => {
        console.log(`[SSE - ${messageFromService.EventType}]: ${JSON.stringify(messageFromService)}`);
        if(messageFromService.EventType === "NewMemberHasJoined")
            processNewMemberHasJoinedEvent(messageFromService.EventData);
    };

    return (
        <>
        <p>Is Leader: {votingContextData.isLeader ? "yes" : "no"}</p>
        <p>Room Id: {votingContextData.roomId}</p>
        <p>Member Id: {votingContextData.memberId}</p>

        { state.members.size > 0 && 
            <table>
                <thead>
                    <tr>
                        <th>Member</th>
                    </tr>
                </thead>
                <tbody>
                { [...state.members].map(memberName =>
                    <tr key={memberName}>
                        <td>{memberName}</td>
                    </tr>
                )}
                </tbody>
            </table>
        }
        </>
    );
}

export default VotingRoom;
