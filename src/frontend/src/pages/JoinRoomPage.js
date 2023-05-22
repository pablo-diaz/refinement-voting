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
            <div className="container col-xl-10 col-xxl-8 px-4 py-5">
                <h1 className="display-4 fw-bold lh-1 text-body-emphasis mb-3 text-center">Refinement Voting</h1>
                <br />
                <div className="col-md-10 mx-auto col-lg-5">
                    <form className="p-4 p-md-5 border rounded-3 bg-body-tertiary">
                        <div className="form-floating mb-3">
                            <input type="text" className="form-control" id="floatingInput" name='memberName' onChange={handleInputChange} />
                            <label htmlFor="floatingInput">What is your name ?</label>
                        </div>
                        <button className="w-100 btn btn-lg btn-primary" type="submit" onClick={handleJoinVotingRoomRequest}>Join voting room</button>
                    </form>
                </div>
            </div>
        }
        {
            state.memberIdResult &&
            <VotingRoom votingContextData={{
                isLeader: false,
                roomId: contextData.roomId,
                memberId: state.memberIdResult,
                invitationLink: null }} />
        }
        </>
    );
}

export default JoinRoomPage;
