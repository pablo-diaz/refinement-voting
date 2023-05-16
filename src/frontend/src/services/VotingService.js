import axios from "axios";

const apiSetup = {
    backendBaseUrl: 'https://localhost:7177/api/votingRoom'
}

const createVotingRoom = async withLeaderName => {
    const postBody = { LeaderName: withLeaderName };
    const { data } = await axios.post(`${apiSetup.backendBaseUrl}/newRoom`, postBody);
    return data;
};

const joinVotingRoom = async (withMemberName, withRoomId) => {
    const postBody = { MemberName: withMemberName, ToRoomId: withRoomId };
    const { data } = await axios.post(`${apiSetup.backendBaseUrl}/newMember`, postBody);
    return data;
};

const requestListMembers = async (inRoomId, forMemberId) => {
    const postBody = { };
    await axios.post(`${apiSetup.backendBaseUrl}/room/${inRoomId}/member/${forMemberId}/getListOfMembers`, postBody);
};

const createNewVotingSession = async (inRoomId) => {
    const postBody = { };
    await axios.post(`${apiSetup.backendBaseUrl}/room/${inRoomId}/newVotingSession`, postBody);
};

const revealVotingResults = async (inRoomId) => {
    const postBody = { };
    await axios.post(`${apiSetup.backendBaseUrl}/room/${inRoomId}/revealResults`, postBody);
};

const submitVote = async (inRoomId, forMemberId, vote) => {
    const postBody = { };
    await axios.post(`${apiSetup.backendBaseUrl}/room/${inRoomId}/member/${forMemberId}/vote/${vote}`, postBody);
};

const hookToServerSentEventsStream = (forMemberId, onMessageFn) => {
    const evtSource = new EventSource(`${apiSetup.backendBaseUrl}/member/${forMemberId}/stream`);
    evtSource.onmessage = theEvent => {
        onMessageFn(JSON.parse(theEvent.data));
    };
}

export default {
    createVotingRoom,
    joinVotingRoom,
    requestListMembers,
    createNewVotingSession,
    submitVote,
    revealVotingResults,
    hookToServerSentEventsStream
};
