import React, { useState } from "react";
import VotingService from "../services/VotingService";

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
                alert('New room has been created successfully');
            });
    }

    return (
        <>
        <form>
            <p>Name of the Leader of this new voting session</p>
            <input type="text" name='leaderName' onChange={handleInputChange} />
            <button onClick={handleCreateNewRoomRequest}>Create new voting room</button>
        </form>
        </>
    );
}

export default CreateRoomPage;