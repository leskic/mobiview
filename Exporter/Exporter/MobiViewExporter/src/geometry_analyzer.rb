# encoding: UTF-8

module MobiViewExporter

  module GeometryAnalyzer

    extend self

    ############################################################
    # ANALISA UMA PEÇA
    ############################################################

    def analyze(entity, world_transform = nil)

      bb = entity.bounds

      x = bb.width.to_mm.round(2)
      y = bb.depth.to_mm.round(2)
      z = bb.height.to_mm.round(2)

      {

        dimensions: {

          x: x,
          y: y,
          z: z

        },

        technical: {

          thickness: [x,y,z].min,

          width: [x,y,z].sort[1],

          height: [x,y,z].max

        },

        center: {

          x: bb.center.x.to_mm.round(2),
          y: bb.center.y.to_mm.round(2),
          z: bb.center.z.to_mm.round(2)

        },

        orientation: smallest_axis(x,y,z),

        axis: largest_axis(x,y,z),

        volume_mm3: (x*y*z).round(2),

        area_mm2: (2*x*y + 2*x*z + 2*y*z).round(2),

        statistics: collect_statistics(entity),

        mesh: build_mesh(
          entity.definition.entities,
          world_transform || entity.transformation,
          best_descendant_material(entity.definition.entities, entity.material)
        )

      }

    end

    ############################################################
    # MALHA TRIANGULADA EM COORDENADAS GLOBAIS
    ############################################################

    def build_mesh(entities, transform, inherited_material = nil)

      positions = []
      colors = []
      uvs = []
      material_ids = []

      collect_mesh(
        entities,
        transform,
        positions,
        colors,
        uvs,
        material_ids,
        inherited_material
      )

      {
        coordinate_system: "sketchup_world_mm",
        positions: positions,
        colors: colors,
        uvs: uvs,
        material_ids: material_ids
      }

    end

    def collect_mesh(entities, transform, positions, colors, uvs, material_ids, inherited_material)

      entities.each do |entity|

        next if entity.deleted?
        next if entity.respond_to?(:hidden?) && entity.hidden?

        case entity

        when Sketchup::Face

          flags = Geom::PolygonMesh::MESH_POINTS |
            Geom::PolygonMesh::MESH_UVQ_FRONT
          mesh = entity.mesh(flags)
          material = effective_material(entity.material, inherited_material)
          face_material = effective_material(entity.material)
          planar_mapping = !material.nil? && face_material.nil?
          color = material_color(material)
          material_id = material_key(material)
          world_normal = transform * entity.normal

          mesh.polygons.each do |polygon|

            indices = polygon.map { |index| index.abs - 1 }
            next if indices.length < 3

            (1...(indices.length - 1)).each do |index|

              material_ids << material_id

              [indices[0], indices[index], indices[index + 1]].each do |point_index|

                point = transform * mesh.points[point_index]

                positions << point.x.to_mm.round(3)
                positions << point.y.to_mm.round(3)
                positions << point.z.to_mm.round(3)

                colors << color[0]
                colors << color[1]
                colors << color[2]

                uv = texture_uv(
                  mesh,
                  point_index,
                  material,
                  point,
                  world_normal,
                  planar_mapping
                )
                uvs << uv[0]
                uvs << uv[1]

              end

            end

          end

        when Sketchup::Group

          collect_mesh(
            entity.entities,
            transform * entity.transformation,
            positions,
            colors,
            uvs,
            material_ids,
            effective_material(entity.material, inherited_material)
          )

        when Sketchup::ComponentInstance

          # Componentes Dinabox válidos são exportados como peças próprias pelo
          # EntityWalker. Ignorá-los na malha do contêiner evita sobreposição,
          # mas mantém as faces diretas da TORRE (laterais e topo).
          next if EntityFilter.valid_piece?(entity)

          collect_mesh(
            entity.definition.entities,
            transform * entity.transformation,
            positions,
            colors,
            uvs,
            material_ids,
            effective_material(entity.material, inherited_material)
          )

        end

      end

    end

    def effective_material(material, inherited_material = nil)

      material ||= inherited_material
      return nil unless material

      if technical_material?(material)
        return inherited_material if inherited_material && inherited_material != material
        return nil
      end

      material

    rescue

      inherited_material

    end

    # Materiais internos do Dinabox não devem aparecer no Viewer.
    # Quando encontrados, usamos o acabamento real herdado dos filhos.
    def technical_material?(material)

      return false unless material

      name = material.respond_to?(:name) ? material.name.to_s.downcase : ""

      return true if name == "db_con_int"
      return true if name.start_with?("db_con_")
      return true if name.include?("construcao")
      return true if name.include?("construction")
      return true if name.include?("invisivel")
      return true if name.include?("invisible")

      color = material.color

      (color.red >= 245 && color.green <= 15 && color.blue <= 15) ||
        (color.red >= 245 && color.green.between?(145, 180) && color.blue <= 15)

    rescue

      false

    end

    # Procura o primeiro acabamento real aplicado nos componentes filhos.
    # Ele será usado nas faces técnicas diretas de TORRE 01/02.
    def best_descendant_material(entities, fallback = nil, definition_stack = [])

      candidate = effective_material(fallback)
      return candidate if candidate && textured_material?(candidate)

      entities.each do |entity|
        next if entity.deleted?
        next if entity.respond_to?(:hidden?) && entity.hidden?

        material = effective_material(entity.respond_to?(:material) ? entity.material : nil)
        return material if material && textured_material?(material)

        case entity
        when Sketchup::Face
          face_material = effective_material(entity.material)
          return face_material if face_material && textured_material?(face_material)

        when Sketchup::Group
          found = best_descendant_material(entity.entities, material || candidate, definition_stack)
          return found if found && textured_material?(found)

        when Sketchup::ComponentInstance
          definition = entity.definition
          next unless definition
          next if definition_stack.include?(definition.guid)

          found = best_descendant_material(
            definition.entities,
            material || candidate,
            definition_stack + [definition.guid]
          )
          return found if found && textured_material?(found)
        end
      end

      candidate || first_real_material(entities, definition_stack)

    rescue

      candidate

    end

    def first_real_material(entities, definition_stack = [])

      entities.each do |entity|
        next if entity.deleted?

        material = effective_material(entity.respond_to?(:material) ? entity.material : nil)
        return material if material

        case entity
        when Sketchup::Face
          face_material = effective_material(entity.material)
          return face_material if face_material

        when Sketchup::Group
          found = first_real_material(entity.entities, definition_stack)
          return found if found

        when Sketchup::ComponentInstance
          definition = entity.definition
          next unless definition
          next if definition_stack.include?(definition.guid)

          found = first_real_material(
            definition.entities,
            definition_stack + [definition.guid]
          )
          return found if found
        end
      end

      nil

    rescue

      nil

    end

    def textured_material?(material)
      material && material.respond_to?(:texture) && !material.texture.nil?
    rescue
      false
    end

    def material_color(material, inherited_material = nil)

      material = effective_material(material, inherited_material)
      return [0.847, 0.776, 0.643] unless material

      color = material.color

      [
        (color.red / 255.0).round(4),
        (color.green / 255.0).round(4),
        (color.blue / 255.0).round(4)
      ]

    rescue

      [0.847, 0.776, 0.643]

    end

    def material_key(material)

      return "__default" unless material

      name = material.respond_to?(:name) ? material.name.to_s : ""
      name.empty? ? material.object_id.to_s : name

    rescue

      "__default"

    end

    def texture_uv(mesh, point_index, material = nil, world_point = nil, world_normal = nil, planar_mapping = false)

      texture = material && material.respond_to?(:texture) ? material.texture : nil

      if planar_mapping && texture && world_point && world_normal
        return planar_texture_uv(world_point, world_normal, texture)
      end

      uvq = mesh.uv_at(point_index + 1, true)
      return [0.0, 0.0] unless uvq

      q = uvq.z.to_f
      return [0.0, 0.0] if q.abs < 0.000001

      u = uvq.x.to_f / q
      v = uvq.y.to_f / q

      # O SketchUp entrega o UV em polegadas físicas. O Three.js trabalha
      # com o tamanho normalizado da imagem (0..1 por repetição).
      if texture
        width = texture.width.to_f
        height = texture.height.to_f
        u /= width if width.abs > 0.000001
        v /= height if height.abs > 0.000001
      end

      [u.round(6), v.round(6)]

    rescue

      [0.0, 0.0]

    end

    def planar_texture_uv(point, normal, texture)

      width = texture.width.to_f
      height = texture.height.to_f
      return [0.0, 0.0] if width.abs < 0.000001 || height.abs < 0.000001

      nx = normal.x.abs
      ny = normal.y.abs
      nz = normal.z.abs

      if nx >= ny && nx >= nz
        u = point.y.to_f / width
        v = point.z.to_f / height
      elsif ny >= nx && ny >= nz
        u = point.x.to_f / width
        v = point.z.to_f / height
      else
        u = point.x.to_f / width
        v = point.y.to_f / height
      end

      [u.round(6), v.round(6)]

    rescue

      [0.0, 0.0]

    end

    ############################################################
    # ESTATÍSTICAS RECURSIVAS
    ############################################################

    def collect_statistics(entity)

      stats = {

        faces: 0,

        edges: 0,

        vertices: {},

        groups: 0,

        components: 0

      }

      scan_entities(

        entity.definition.entities,

        stats

      )

      stats[:vertices] = stats[:vertices].size

      stats

    end

    ############################################################
    # VARREDURA RECURSIVA
    ############################################################

    def scan_entities(entities, stats)

      entities.each do |e|

        case e

        when Sketchup::Face

          stats[:faces] += 1

        when Sketchup::Edge

          stats[:edges] += 1

          e.vertices.each do |v|

            stats[:vertices][v.persistent_id] = true

          end

        when Sketchup::Group

          stats[:groups] += 1

          scan_entities(

            e.entities,

            stats

          )

        when Sketchup::ComponentInstance

          stats[:components] += 1

          scan_entities(

            e.definition.entities,

            stats

          )

        end

      end

    end

    ############################################################
    # MENOR EIXO
    ############################################################

    def smallest_axis(x,y,z)

      {

        x:x,

        y:y,

        z:z

      }.min_by{|k,v| v}[0].to_s.upcase

    end

    ############################################################
    # MAIOR EIXO
    ############################################################

    def largest_axis(x,y,z)

      {

        x:x,

        y:y,

        z:z

      }.max_by{|k,v| v}[0].to_s.upcase

    end

  end

end
