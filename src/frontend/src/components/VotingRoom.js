import React, { useEffect, useState } from "react";
import VotingService from "../services/VotingService";
import VotingCard from "./Card";

const VotingRoom = ({ votingContextData }) => {
    useEffect(()=>{
        const timeoutHandler = setTimeout(() => {
            VotingService.hookToServerSentEventsStream(votingContextData.memberId, processEventFromVotingService);
            VotingService.requestListMembers(votingContextData.roomId, votingContextData.memberId);
        }, 2000);

        return () => clearTimeout(timeoutHandler) 
    }, []);

    const votingOptions = ['1', '2', '3', '5', '8', '13'];

    const RoomStatus = {
        NewVotingSessionCanBeStarted: 1,
        VotingSessionHasStarted: 2
    }

    const ValueWrapper = (theValue) => {
        return {
            get value() { return theValue; },
            set value(newValue) { theValue = newValue; }
        };
    }

    const [state, setState] = useState({ members: ValueWrapper([]), roomStatus: ValueWrapper(RoomStatus.NewVotingSessionCanBeStarted), overallAverage: ValueWrapper(-1) });

    const [lastVoteSubmitted, setLastVoteSubmitted] = useState({ vote: ValueWrapper('0')});

    const processNewMemberHasJoinedEvent = eventData => {
        const countOfExistingMembersWithSameNameFound = state.members.value.filter(m => m.name === eventData.MemberName).length;
        if(countOfExistingMembersWithSameNameFound === 0) {
            var newState = {...state};
            newState.members.value.push({ name: eventData.MemberName, hasVoted: false, vote: 0 });
            setState(newState);
        }
    };

    const processNewVotingSessionHasStartedEvent = () => {
        var newState = {...state};
        newState.members.value = newState.members.value.map(member => { return { ...member, hasVoted: false, vote: 0 }; });
        newState.roomStatus.value = RoomStatus.VotingSessionHasStarted;
        setState(newState);

        var newLastVoteSubmitted = {...lastVoteSubmitted};
        newLastVoteSubmitted.vote.value = '0';
        setLastVoteSubmitted(newLastVoteSubmitted);
    }

    const processMemberHasVotedEvent = eventData => {
        var newState = {...state};
        newState.members.value = newState.members.value.map(member => {
            if(member.name === eventData.MemberName)
                return { ...member, hasVoted: true };
            return member;
        });
        setState(newState);
    }

    const processVotingResultRevealedEvent = eventData => {
        var newState = {...state};
        newState.members.value = newState.members.value.map(member => {
            const voteForMemberFound = eventData.Votes.filter(v => v.MemberName === member.name);
            if(voteForMemberFound.length === 0)  // member did not vote
                return { ...member, hasVoted: false };

            return { ...member, hasVoted: true, vote: voteForMemberFound[0].Vote };
        });
        newState.overallAverage.value = eventData.Average;
        newState.roomStatus.value = RoomStatus.NewVotingSessionCanBeStarted;
        setState(newState);
    }

    const canNewVotingSessionBeStarted = () =>
        votingContextData.isLeader && state.members.value.length >= 2 && state.roomStatus.value === RoomStatus.NewVotingSessionCanBeStarted;

    const canVotesBeRevealed = () =>
        votingContextData.isLeader && state.roomStatus.value === RoomStatus.VotingSessionHasStarted && state.members.value.filter(m => m.hasVoted).length > 0;

    const canInvitationLinkBeCopied = () => votingContextData.invitationLink ? true : false;

    const canVoteBeSubmitted = () =>
        state.roomStatus.value === RoomStatus.VotingSessionHasStarted;

    const canLastAverageBeDisplayed = () =>
        state.roomStatus.value === RoomStatus.NewVotingSessionCanBeStarted && state.overallAverage.value >= 0;

    const processEventFromVotingService = messageFromService => {
        if(messageFromService.EventType === "NewMemberHasJoined")
            processNewMemberHasJoinedEvent(messageFromService.EventData);
        else if(messageFromService.EventType === "NewVotingSessionHasStarted")
            processNewVotingSessionHasStartedEvent();
        else if(messageFromService.EventType === "MemberHasVoted")
            processMemberHasVotedEvent(messageFromService.EventData);
        else if(messageFromService.EventType === "VotingResultRevealed")
            processVotingResultRevealedEvent(messageFromService.EventData);
    };

    const handleCopyInvitationLinkRequest = e => {
        e.preventDefault();
        navigator.clipboard.writeText(votingContextData.invitationLink);
    }

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

        var newLastVoteSubmitted = {...lastVoteSubmitted};
        newLastVoteSubmitted.vote.value = votingPoints;
        setLastVoteSubmitted(newLastVoteSubmitted);
    }

    const displayVote = member =>
        member.hasVoted === false
            ? "?"
            : state.roomStatus.value === RoomStatus.VotingSessionHasStarted
                ? "(voted)"
                : member.vote > 0
                    ? "" + member.vote
                    : "X";

    const hasMemberVotedAlready = member =>
    member.hasVoted === false
        ? false
        : state.roomStatus.value === RoomStatus.VotingSessionHasStarted
            ? true
            : member.vote > 0
                ? true
                : false;

    return (
        <>
        <br />
        <div className="container-fluid">
            <div className="row">
                <div className="col-10">
                    {
                        canVoteBeSubmitted() &&
                        <div>
                            <div className="container-fluid">
                                <h2>Please submit your vote</h2>
                                <div className="row text-center">
                                    {
                                        votingOptions.map(vote =>
                                            <div key={vote} className="col-2">
                                                <VotingCard cardContextData={{ label: vote, onClick: e => handleVoteSubmitRequest(e, vote), selected: lastVoteSubmitted.vote.value === vote }} />
                                            </div>
                                    )}
                                </div>
                            </div>
                            <hr />
                        </div>
                    }

                    {
                        state.members.value.length > 0 &&
                        <div className="container-fluid">
                            <div className="row text-center gy-3">
                                { state.members.value.map(member =>
                                    <div key={member.name} className="col-2"><VotingCard cardContextData={{ memberName: member.name, label: displayVote(member), voteSubmitted: hasMemberVotedAlready(member) }} /></div>
                                )}
                            </div>
                        </div>
                    }
                </div>

                <div className="col-2 text-center">
                    {
                        canLastAverageBeDisplayed() &&
                        <div className="card">
                            <div className="card-body">
                                <h3>Last average</h3>
                                <h2>{state.overallAverage.value.toFixed(1)}</h2>
                            </div>
                        </div>
                    }

                    {
                        canInvitationLinkBeCopied() &&
                        <div>
                            <br />
                            <div className="card">
                                <div className="card-body">
                                    <a className="btn btn-primary" onClick={handleCopyInvitationLinkRequest}>Copy invitation link</a>
                                </div>
                            </div>
                        </div>
                    }

                    {
                        canNewVotingSessionBeStarted() &&
                        <div>
                            <br />
                            <div className="card">
                                <div className="card-body">
                                    <a className="btn btn-primary" onClick={handleNewVotingSessionRequest}>Start new Voting Session</a>
                                </div>
                            </div>
                        </div>
                    }

                    {
                        canVotesBeRevealed() &&
                        <div>
                            <br />
                            <div className="card">
                                <div className="card-body">
                                    <a className="btn btn-primary" onClick={handleRevealVotingResultsRequest}>Reveal voting results</a>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
        </>
    );
}

export default VotingRoom;
