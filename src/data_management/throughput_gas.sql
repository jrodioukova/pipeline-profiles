SELECT
cast(cast([Month] as varchar)+'-'+cast([Date] as varchar)+'-'+cast([Year] as varchar) as date) as [Date],
[Corporate Entity],
[Key Point],
[Direction of Flow],
[Trade Type],
round([Capacity (1000 m3/d)],0) as [Capacity (1000 m3/d)],
round([Throughput (1000 m3/d)],0) as [Throughput (1000 m3/d)]
FROM [EnergyData].[dbo].[Pipelines_Gas]

where [Year] >= '2010'
order by [Corporate Entity],[Key Point], cast(cast([Month] as varchar)+'-'+cast([Date] as varchar)+'-'+cast([Year] as varchar) as date)