import React, { useState } from "react";
import VotingService from "../services/VotingService";
import VotingRoom from '../components/VotingRoom';

const CreateRoomPage = () => {
    const [state, setState] = useState({ });

    const generateNewStateForAttribute = (previousState, fieldName, newValueForField) => {
        const newState = { ...previousState };
        newState[fieldName] = newValueForField;
        return newState;
    }

    const handleInputChange = e => {
        setState(generateNewStateForAttribute(state, e.target.name, e.target.value));
    }

    const handleCreateNewRoomRequest = e => {
        e.preventDefault();
        VotingService.createVotingRoom(state.leaderName)
            .then(result => {
                setState(generateNewStateForAttribute(state, 'serviceResult', result));
            });
    }

    return (
        <>
        {
            !state.serviceResult &&
            <form>
                <p>Name of the Leader of this new voting session</p>
                <input type="text" name='leaderName' onChange={handleInputChange} />
                <button onClick={handleCreateNewRoomRequest}>Create new voting room</button>
            </form>
            
        }
        {
            state.serviceResult &&
            <div>
                <h1>New room has been created successfully</h1>
                <p>Please, let others know that the room ID is {`${window.location.href}?r=${state.serviceResult.newRoomId}`}</p>
                <br />
                <VotingRoom votingContextData={{ isLeader: true, roomId: state.serviceResult.newRoomId, memberId: state.serviceResult.memberIdForLeader }} />
            </div>
        }
        </>
    );
}

export default CreateRoomPage;