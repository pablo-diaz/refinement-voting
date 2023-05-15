import React, { useState } from "react";
import VotingService from "../services/VotingService";
import VotingRoom from '../components/VotingRoom';

const JoinRoomPage = ({ contextData }) => {
    const [state, setState] = useState({ });

    const generateNewStateForAttribute = (previousState, fieldName, newValueForField) => {
        const newState = { ...previousState };
        newState[fieldName] = newValueForField;
        return newState;
    }

    const handleInputChange = e => {
        setState(generateNewStateForAttribute(state, e.target.name, e.target.value));
    }

    const handleJoinVotingRoomRequest = e => {
        e.preventDefault();
        VotingService.joinVotingRoom(state.memberName, contextData.roomId)
            .then(result => {
                setState(generateNewStateForAttribute(state, 'memberIdResult', result));
            });
    }

    return (
        <>
        {
            !state.memberIdResult &&
            <form>
                <p>Please place your name here</p>
                <input type="text" name='memberName' onChange={handleInputChange} />
                <button onClick={handleJoinVotingRoomRequest}>Join voting room</button>
            </form>
        }
        {
            state.memberIdResult &&
            <VotingRoom votingContextData={{ isLeader: false, roomId: contextData.roomId, memberId: state.memberIdResult }} />
        }
        </>
    );
}

export default JoinRoomPage;
