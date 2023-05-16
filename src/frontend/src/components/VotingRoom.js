import React, { useEffect, useState } from "react";
import VotingService from "../services/VotingService";

const VotingRoom = ({ votingContextData }) => {
    useEffect(()=>{
        const timeoutHandler = setTimeout(() => {
            VotingService.hookToServerSentEventsStream(votingContextData.memberId, processEventFromVotingService);
            VotingService.requestListMembers(votingContextData.roomId, votingContextData.memberId);
        }, 2000);

        return () => clearTimeout(timeoutHandler) 
    }, []);

    const RoomStatus = {
        NewVotingSessionCanBeStarted: 1,
        VotingSessionHasStarted: 2
    }

    const [state, setState] = useState({ members: [], roomStatus: RoomStatus.NewVotingSessionCanBeStarted });

    const processNewMemberHasJoinedEvent = eventData => {
        const countOfExistingMembersWithSameNameFound = state.members.filter(m => m.name === eventData.MemberName).length;
        if(countOfExistingMembersWithSameNameFound === 0) {
            var newState = {...state};
            newState.members.push({ name: eventData.MemberName, hasVoted: false, vote: 0 });
            setState(newState);
        }
    };

    const processNewVotingSessionHasStartedEvent = () => {
        var newState = {...state};
        newState.members = newState.members.map(member => { return { ...member, hasVoted: false, vote: 0 }; });
        newState.roomStatus = RoomStatus.VotingSessionHasStarted;
        setState(newState);
    }

    const processMemberHasVotedEvent = eventData => {
        var newState = {...state};
        newState.members = newState.members.map(member => {
            if(member.name === eventData.MemberName)
                return { ...member, hasVoted: true };
            return member;
        });
        setState(newState);
    }

    const processVotingResultRevealedEvent = eventData => {
        var newState = {...state};
        newState.members = newState.members.map(member => {
            const voteForMemberFound = eventData.Votes.filter(v => v.MemberName === member.name);
            if(voteForMemberFound.length === 0)  // member did not vote
                return { ...member, hasVoted: false };

            return { ...member, hasVoted: true, vote: voteForMemberFound[0].Vote };
        });
        newState.roomStatus = RoomStatus.NewVotingSessionCanBeStarted;
        setState(newState);
    }

    const canNewVotingSessionBeStarted = () =>
        votingContextData.isLeader && state.members.length >= 2 && state.roomStatus === RoomStatus.NewVotingSessionCanBeStarted;

    const canVotesBeRevealed = () =>
        votingContextData.isLeader && state.roomStatus === RoomStatus.VotingSessionHasStarted && state.members.filter(m => m.hasVoted).length > 0;

    const canVoteBeSubmitted = () =>
        state.roomStatus === RoomStatus.VotingSessionHasStarted;

    const processEventFromVotingService = messageFromService => {
        console.log(`[SSE - ${messageFromService.EventType}]: ${JSON.stringify(messageFromService)}`);
        if(messageFromService.EventType === "NewMemberHasJoined")
            processNewMemberHasJoinedEvent(messageFromService.EventData);
        else if(messageFromService.EventType === "NewVotingSessionHasStarted")
            processNewVotingSessionHasStartedEvent();
        else if(messageFromService.EventType === "MemberHasVoted")
            processMemberHasVotedEvent(messageFromService.EventData);
        else if(messageFromService.EventType === "VotingResultRevealed")
            processVotingResultRevealedEvent(messageFromService.EventData);
    };

    const handleNewVotingSessionRequest = e => {
        e.preventDefault();
        VotingService.createNewVotingSession(votingContextData.roomId);
    }

    const handleRevealVotingResultsRequest = e => {
        e.preventDefault();
        VotingService.revealVotingResults(votingContextData.roomId);
    }

    const handleVoteSubmitRequest = (e, votingPoints) => {
        e.preventDefault();
        VotingService.submitVote(votingContextData.roomId, votingContextData.memberId, votingPoints);
    }

    const displayVote = member =>
        member.hasVoted === false
            ? "?"
            : member.vote > 0
                ? "" + member.vote
                : "X";

    return (
        <>
        {
           canNewVotingSessionBeStarted() &&
           <div>
               <button onClick={handleNewVotingSessionRequest}>Start new voting session</button>
               <br/>
           </div>
        }

        {
           canVotesBeRevealed() &&
           <div>
               <button onClick={handleRevealVotingResultsRequest}>Reveal voting results</button>
               <br/>
           </div>
        }

        {
           canVoteBeSubmitted() &&
           <div>
               <button onClick={e => handleVoteSubmitRequest(e, 0)}>I don't know / I want to skip</button>
               <button onClick={e => handleVoteSubmitRequest(e, 1)}>1 story points</button>
               <button onClick={e => handleVoteSubmitRequest(e, 2)}>2 story points</button>
               <button onClick={e => handleVoteSubmitRequest(e, 3)}>3 story points</button>
               <button onClick={e => handleVoteSubmitRequest(e, 5)}>5 story points</button>
               <button onClick={e => handleVoteSubmitRequest(e, 8)}>8 story points</button>
               <button onClick={e => handleVoteSubmitRequest(e, 13)}>13 story points</button>
               <br/>
           </div>
        }

        { state.members.size > 0 && 
            <table>
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Vote</th>
                    </tr>
                </thead>
                <tbody>
                { state.members.map(member =>
                    <tr key={member.name}>
                        <td>{member.name}</td>
                        <td>{displayVote(member)}</td>
                    </tr>
                )}
                </tbody>
            </table>
        }
        </>
    );
}

export default VotingRoom;
