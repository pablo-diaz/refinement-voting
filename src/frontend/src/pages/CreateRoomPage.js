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

    const getFirstValidationError = forLeaderName => {
        if(!forLeaderName || forLeaderName.trim().length <= 3)
            return "Please provide a valid name for the Leader of this meeting";

        return null;  // no validation errors found
    }

    const handleCreateNewRoomRequest = e => {
        e.preventDefault();

        const maybeValidationErrorFound = getFirstValidationError(state.leaderName);
        if(maybeValidationErrorFound) {
            alert(maybeValidationErrorFound);
            return;
        }
        
        VotingService.createVotingRoom(state.leaderName)
            .then(result => {
                setState(generateNewStateForAttribute(state, 'serviceResult', result));
            });
    }

    return (
        <>
        {
            !state.serviceResult &&
            <div className="container col-xl-10 col-xxl-8 px-4 py-5">
                <h1 className="display-4 fw-bold lh-1 text-body-emphasis mb-3 text-center">Refinement Voting</h1>
                <br />
                <div className="col-md-10 mx-auto col-lg-5">
                    <form className="p-4 p-md-5 border rounded-3 bg-body-tertiary">
                        <div className="form-floating mb-3">
                            <input type="text" className="form-control" id="floatingInput" name='leaderName' onChange={handleInputChange} />
                            <label htmlFor="floatingInput">Name of the Leader</label>
                        </div>
                        <button className="w-100 btn btn-lg btn-primary" type="submit" onClick={handleCreateNewRoomRequest}>Create session</button>
                    </form>
                </div>
            </div>
        }
        {
            state.serviceResult &&
            <VotingRoom votingContextData={{
                isLeader: true,
                roomId: state.serviceResult.newRoomId,
                memberId: state.serviceResult.memberIdForLeader,
                invitationLink: `${window.location.href}?r=${state.serviceResult.newRoomId}` }} />
        }
        </>
    );
}

export default CreateRoomPage;