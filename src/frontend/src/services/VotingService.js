import axios from "axios";

const getBackendBaseUrl = async () =>
    (JSON.parse(
        JSON.stringify(
            (await axios.get("ui-config.json")).data
        )
    )).backendBaseUrl;

const createVotingRoom = async withLeaderName => {
    const postBody = { LeaderName: withLeaderName };
    const { data } = await axios.post(`${await getBackendBaseUrl()}/newRoom`, postBody);
    return data;
};

const joinVotingRoom = async (withMemberName, withRoomId) => {
    const postBody = { MemberName: withMemberName, ToRoomId: withRoomId };
    const { data } = await axios.post(`${await getBackendBaseUrl()}/newMember`, postBody);
    return data;
};

const requestListMembers = async (inRoomId, forMemberId) => {
    const postBody = { };
    await axios.post(`${await getBackendBaseUrl()}/room/${inRoomId}/member/${forMemberId}/getListOfMembers`, postBody);
};

const createNewVotingSession = async (inRoomId) => {
    const postBody = { };
    await axios.post(`${await getBackendBaseUrl()}/room/${inRoomId}/newVotingSession`, postBody);
};

const revealVotingResults = async (inRoomId) => {
    const postBody = { };
    await axios.post(`${await getBackendBaseUrl()}/room/${inRoomId}/revealResults`, postBody);
};

const submitVote = async (inRoomId, forMemberId, vote) => {
    const postBody = { };
    await axios.post(`${await getBackendBaseUrl()}/room/${inRoomId}/member/${forMemberId}/vote/${vote}`, postBody);
};

const hookToServerSentEventsStream = (forMemberId, onMessageFn) => {
    getBackendBaseUrl()
        .then(baseUrl => {
            const evtSource = new EventSource(`${baseUrl}/member/${forMemberId}/stream`);
            evtSource.onmessage = theEvent => {
                onMessageFn(JSON.parse(theEvent.data));
            };
        });
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
