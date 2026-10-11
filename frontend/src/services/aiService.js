const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const aiService = {
  async mockChatResponse(message) {
    // Simulate natural thinking delay
    await delay(1000 + Math.random() * 1500);
    const msg = message.toLowerCase();

    if (msg.includes('delay') || msg.includes('cancel')) {
      return "I can help with disruptions. If your flight is delayed under 2 hours, please keep an eye on the airport departure boards. For delays over 3 hours or cancellations, you should head to the airline's rebooking desk. You may also be entitled to compensation or meal vouchers depending on local regulations.\n\n*(Note: I do not have access to live airline systems. Always confirm with airport staff).*";
    }
    if (msg.includes('sw101')) {
      return "According to our demo database, **SkyWings Airlines SW101** from New York (JFK) to London (LHR) is currently marked as **ON TIME**. \n\n*(Remember, this is simulated information for demonstration purposes only).*";
    }
    if (msg.includes('save') || msg.includes('trip')) {
      return "You can easily keep track of your flights! When viewing any flight's detail page, just click the **Save Trip** button. It will be stored in your browser and visible on the 'Saved Trips' dashboard.";
    }
    if (msg.includes('search') || msg.includes('find') || msg.includes('book')) {
      return "To find a flight, please navigate to the **Search** tab. You can look up available demo routes (for example, try searching from JFK to LHR or SYD to LAX).";
    }
    if (msg.includes('baggage') || msg.includes('airport') || msg.includes('prepare')) {
      return "When heading to the airport, it is generally recommended to arrive at least 2 hours before domestic flights and 3 hours before international flights. Check your airline's specific baggage weight limits online before packing!";
    }

    return "Hello! I am AeroMate, your AI aviation companion. I can answer questions about simulated flight statuses (try asking about SW101), explain what to do during delays, or help you navigate this app. How can I assist you today?";
  }
};
