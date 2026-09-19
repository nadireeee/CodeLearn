{question.images && question.images.length > 0 && (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
    {question.images.map((img, idx) => (
      <Image
        key={idx}
        source={{ uri: img }}
        style={{ width: 120, height: 120, borderRadius: 8, margin: 4 }}
        resizeMode="cover"
      />
    ))}
  </View>
)} 