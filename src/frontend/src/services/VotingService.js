import axios from "axios";

const apiSetup = {
    backendBaseUrl: 'https://localhost:7177/api/votingRoom'
}

const createVotingRoom = async withLeaderName => {
    const postBody = { LeaderName: withLeaderName };
    const { data } = await axios.post(`${apiSetup.backendBaseUrl}/newRoom`, postBody);
    return data;
};

export default {
    createVotingRoom
};
